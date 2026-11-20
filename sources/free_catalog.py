#!/usr/bin/env python3
"""Refresh the free, official-platform VOD layer. Does not download video or touch M3U."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import urlparse
from datetime import date
import io,json,re,unicodedata
import requests
from bs4 import BeautifulSoup
from PIL import Image,ImageOps
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/free';OUT.mkdir(exist_ok=True)
IC='https://www.itauculturalplay.com.br'; YT='https://www.youtube.com'
# Curated public title routes. The streaming service performs playback and handles login/territory.
IC_FILMS=['carandiru-3','durval-discos','eles-nao-usam-black-tie','sao-paulo-sociedade-anonima','uma-historia-de-amor-e-furia','lilian-m-relatorio-confidencial','mato-seco-em-chamas','os-primeiros-soldados','chuva-e-cantoria-na-aldeia-dos-mortos','lulina-e-a-lua','teca-e-tuti']
IC_SERIES=['o-diario-de-mika','gildo','crisalida','brinquedonautas']
YT_FILMS=[
('rota-de-fuga','Rota de Fuga','2013','Ação','Sl5FZcUJmgo','Um especialista em fugas é preso em uma prisão de segurança máxima e precisa da ajuda de outro detento para escapar. Com Sylvester Stallone e Arnold Schwarzenegger.','Adrenalina Pura TV BR'),
('blitz','Blitz','2011','Ação','1nGu35I3W7A','Um policial de Londres caça um assassino que tem agentes da polícia como alvo. Com Jason Statham.','Adrenalina Pura TV BR'),
('xeque-mate','Xeque-Mate','2006','Suspense','wBAqZwNiIBM','Confundido com o amigo que procurava, Slevin se vê no meio de uma disputa entre chefes do crime.','Adrenalina Pura TV BR'),
('hora-do-acerto','A Hora do Acerto','2004','Ação','hQEESJcuSO0','Depois de perder sua equipe, um inspetor da polícia de Hong Kong volta a investigar a gangue responsável. Com Jackie Chan.','Adrenalina Pura TV BR'),
('lukas','Lukas','2018','Ação','pZrmKxrB3UI','Um segurança de boate aceita trabalhar infiltrado para proteger a filha. Com Jean-Claude Van Damme.','Adrenalina Pura TV BR'),
('imperador','O Imperador','2014','Ação','VnHSQ4ZPvE4','Guerreiros estrangeiros ajudam dois herdeiros a escapar de uma disputa pelo trono da China. Com Nicolas Cage.','Adrenalina Pura TV BR'),
('jogada-de-mestre','Jogada de Mestre','2015','Ação','Gf59UAHs-iY','Um grupo contrata um ladrão para roubar um cassino; quando o plano dá errado, a fuga vira uma tomada de reféns.','Adrenalina Pura TV BR'),
('memoria-de-um-crime','Memória de um Crime','2018','Suspense','UMD56fE1e1E','Depois de um roubo fracassado, o único sobrevivente não consegue se lembrar de onde escondeu o dinheiro.','Adrenalina Pura TV BR'),
('se-liga-na-turma-da-monica','Se Liga na Turma da Mônica','2011','Animação','LBKvaFuFXWo','Uma coletânea da Turma da Mônica: entre invenções e planos infalíveis, a turma transforma a rua em palco de aventuras.','Turma da Mônica'),
]
YT_SERIES=[
('mr-bean','Mr. Bean','1990–1995','Comédia','Pequenas tarefas viram grandes confusões nas mãos de Mr. Bean, interpretado por Rowan Atkinson.','Mr Bean','Inglês',[('A volta de Mr. Bean','U5yx197DtfI'),('Mr. Bean no quarto 426','sSUUCUIU-lI'),('De olho no bebê, Mr. Bean','J4Vcm8wF02g')]),
('turma-da-monica','Turma da Mônica','Animação','Animação','Mônica, Cebolinha e Cascão vivem aventuras e bolam planos no Bairro do Limoeiro.','Turma da Mônica','Português',[('O circo','zM0b54u6ukc'),('O robô','HmunqEiOSnE'),('Maratona de competições','X7CN-yGVzgM')]),
('pokemon-liga-indigo','Pokémon: Liga Índigo','1997','Anime','Ash parte em sua jornada Pokémon e descobre que Pikachu tem personalidade própria.','Pokémon','Inglês',[('Pokémon, eu escolho você!','z3hMX65Khtg'),('Emergência Pokémon','h6LFdBPjbf4')]),
('power-rangers','Power Rangers: Mighty Morphin','1993','Aventura','Cinco adolescentes recebem poderes para proteger a Terra e se tornam os primeiros Power Rangers.','Power Rangers em Português','Português',[('A surpresa','lRLZOmfGhwA'),('Gatos e leões','PviYYrw8Qv4'),('A discórdia','7NNhvbdJWXg'),('A grande fuga','GWpJo7jA2OM')]),
('masha-e-o-urso','Masha e o Urso','2009','Animação','Masha transforma a tranquilidade do Urso em uma sequência de aventuras na floresta.','Masha e o Urso','Português',[('O filhote abandonado','6BFJ_IesCYU'),('Tudo em família','Dq1dZTRsfdw')]),
('peppa-pig','Peppa Pig','2004','Animação','Peppa, seu irmão George e seus amigos descobrem o mundo em histórias curtas para a família.','Peppa Pig em Português Brasil','Português',[('Vários episódios completos','TcrMbWg7rkw'),('O livro da Mamãe Pig','2bvZ9OmsG-U')]),
('sonic-x','Sonic X','2003','Anime','Sonic e seus amigos chegam ao mundo dos humanos e precisam recuperar as Esmeraldas do Caos antes do Dr. Eggman.','Anime! on TMS Official Channel','Inglês',[('Chaos Control Freaks','9CGih4gMRlk'),('The Dam Scam','hnUYv2VhcY8')]),
('garfield-show','O Show do Garfield','2008','Animação','Garfield prefere lasanha e sonecas, mas o cachorro Odie e as trapalhadas de Jon sempre interrompem seus planos.','THE GARFIELD SHOW OFFICIAL','Inglês',[('As aventuras de Garfield','w9NgWHa6Jq4'),('Cinco episódios em sequência','fU_rVXU06IU')]),
('monica-toy','Mônica Toy','2013','Animação','Versões em miniatura da Turma da Mônica protagonizam esquetes animadas sem diálogos.','Monica Toy','Sem diálogo',[('Maratona da 10ª temporada','K-IXkCKlxXs')]),
('mr-bean-animado','Mr. Bean: A Série Animada','2002','Animação','Mr. Bean e seu inseparável Teddy ganham aventuras próprias em desenho animado.','Mr Bean','Inglês',[('In the Pink','ExGBF8hG-fU'),('A corrida de Mr. Bean','isvoS40gEAE')]),
]

KIDS_SERIES=[
('pocoyo','Pocoyo','2005','Animação','Pocoyo explora o mundo brincando com Pato, Elly e Loula.','Pocoyo 🇧🇷 Português Brasil - Canal Oficial','Português',[('Temporada 1: episódios 33–36','o_9_0JfJ4bc'),('Temporada 1: episódios 49–52','Q5DaWm8t8XM'),('Temporada 1: episódios 25–28','ysTuX8fhvSE')]),
('bluey','Bluey','2018','Animação','Bluey e sua irmã Bingo transformam o dia a dia da família em brincadeiras cheias de imaginação.','Bluey Português Brasil - Canal Oficial','Português',[('O melhor da segunda temporada','NopTW6G2k9w'),('O mundo de Bluey','mMC352cfAA8'),('Compilação de episódios completos','_0gEcNvaImg')]),
('chico-bento','Chico Bento','','Animação','Na Vila Abobrinha, Chico Bento vive histórias da roça ao lado de Rosinha, Zé Lelé e Dona Marocas.','Turma da Mônica','Português',[('A flor','qpUcy_1Rf-U'),('Conta outra','mc-C0e2KJFc'),('Sonolento, sonolento!','8IWk_SRos8E')]),
('o-show-da-luna','O Show da Luna!','2014','Animação','Luna, Júpiter e o furão Cláudio fazem experiências para descobrir como o mundo funciona.','O Show da Luna!','Português',[('No deserto faz calor ou frio?','C6xt2Roo_vM'),('Como fazer um iglu?','PRI2PZIH_1I'),('Pra que serve a tromba do elefante?','oQyo2LjwBLM')]),
('peixonauta','Peixonauta','2009','Animação','Peixonauta, Marina e Zico investigam mistérios no Parque das Árvores Felizes.','Peixonauta','Português',[('O caso dos bichos desconhecidos','M8sNHN63YM0'),('O caso do monstro','tRbvz2oBvS8'),('O caso do novo melhor amigo','oLwC6pCaCmg'),('Maratona: Sempre alerta!','2HStEHvK0os')]),
('mundo-bita-imagine-se','Mundo Bita: Imagine-se','2022','Animação','Bita e sua turma usam música e imaginação para aprender a lidar com sentimentos e desafios do dia a dia.','Mundo Bita','Português',[('Meu, seu, nosso','U8OPUdORWjA'),('Sentir e falar, como é bom se expressar','anQthyrhkuc'),('Mesmo longe, sempre perto','hJql2nUsq8M')]),
('thomas-e-seus-amigos','Thomas e Seus Amigos','1984','Animação','Thomas e as locomotivas da ilha de Sodor aprendem a trabalhar em equipe enquanto transportam passageiros e encomendas.','Thomas e Seus Amigos','Português',[('Hannah apressada','E9UUuibtRqg'),('Uma locomotiva de muitas cores e outras histórias','MkBTCR5z_WA')]),
('teletubbies','Teletubbies','1997','Infantil','Tinky Winky, Dipsy, Laa-Laa e Po vivem brincadeiras na Terra dos Teletubbies.','Teletubbies Português Brasil - WildBrain','Português',[('Saltando!','xHqdErNdln8'),('Pintura com mãos e pés','USSheym3ixw')]),
('simon-super-coelho','Simon Super Coelho','','Animação','Simon usa sua imaginação para virar o Super Coelho e embarcar em aventuras com os amigos.','Simon Super Coelho','Português',[('Chocolate em perigo! — compilação','svF6wOBvJQI')]),
]
KIDS_ORDER=['turma-da-monica']+[row[0] for row in KIDS_SERIES]
KIDS_IDS=set(KIDS_ORDER+['monica-toy','masha-e-o-urso','peppa-pig','o-diario-de-mika','gildo','brinquedonautas'])

def order_series(rows):
    byid={row['id']:row for row in rows}
    for row in rows:
        if row['id'] in KIDS_IDS:row['family']=True
    return [byid[id] for id in KIDS_ORDER if id in byid]+[row for row in rows if row['id'] not in KIDS_ORDER]

def get(url,**kw):
    r=requests.get(url,timeout=12,headers={'User-Agent':'Mozilla/5.0 NovaIPTV Catalog'},**kw);r.raise_for_status();return r

def artwork(slug,url,hero=False):
    assert urlparse(url).scheme=='https'
    r=get(url); src=Image.open(io.BytesIO(r.content)).convert('RGB');
    # Preserve faces on landscape stills and keep imagery compact in the standalone preview.
    img=ImageOps.fit(src,(968,544) if hero else (448,252),Image.Resampling.LANCZOS,centering=(.5,.46));img.save(OUT/(slug+'.webp'),'WEBP',quality=84 if hero else 79,method=5)

def ic(kind,slug):
    url=f'{IC}/content/{kind}/{slug}'
    soup=BeautifulSoup(get(url).content,'html.parser'); data=None
    for el in soup.find_all('script'):
        t=el.get_text(); m=re.fullmatch(r'self\.__next_f\.push\((\[.*\])\)',t,re.S)
        if not m or 'initialData' not in t:continue
        decoded=json.loads(m[1])[1]; found=decoded.split('"initialData":',1)
        if len(found)==2:
            candidate=json.JSONDecoder().raw_decode(found[1])[0]
            if isinstance(candidate,dict) and candidate.get('slug')==slug:data=candidate;break
    assert data and data['type']==('Movie' if kind=='movies' else 'Serie'),'ficha indisponível'
    image=data['imageUrl']; art='free-'+slug; artwork(art,image,hero=slug=='carandiru-3')
    return dict(id=slug,type=kind,kind='website',name=data['title'],year=data['releaseDate'][:4],genre=data['genre'] if data['genre']!='Série' else ('Drama' if slug=='crisalida' else 'Animação'),description=data['synopsis'],source=url,provider='Itaú Cultural Play',collection='brasil',access='Grátis · cadastro gratuito no Itaú Cultural Play. A disponibilidade depende da região.',language='Português',duration=data['duration'] if str(data['duration']).endswith('min') else '',rating=(data.get('ageRating') or {}).get('label',''),credit=(data.get('directors') or 'Itaú Cultural Play'),art=art,artSource=image)

def yt(vid,author):
    url=YT+'/watch?v='+vid; j=get(YT+'/oembed',params={'url':url,'format':'json'}).json()
    fold=lambda x:unicodedata.normalize('NFC',x).casefold()
    assert fold(author) in fold(j['author_name']),j['author_name']
    # OEmbed establishes that the video is public and belongs to the selected channel.
    return url,j['thumbnail_url'],j['title']

def film(row):
    id,name,year,genre,vid,desc,author=row; url,img,title=yt(vid,author)
    assert 'filme completo' in title.lower() or id=='se-liga-na-turma-da-monica',title
    art='free-'+id; artwork(art,img)
    return dict(id=id,type='movies',kind='website',name=name,year=year,genre=genre,description=desc,source=url,provider='YouTube',collection='dublados',access='Grátis no canal oficial. Pode ter anúncios ou restrição regional.',language='Português',credit=author,art=art,artSource=img)

def serie(row):
    id,name,year,genre,desc,author,language,eps=row; result=[]; art='free-'+id; source=None
    for i,(title,vid) in enumerate(eps,1):
        try: link,image,_=yt(vid,author)
        except Exception as e: print('Episódio omitido:',id,title,str(e)[:100]);continue
        if not source:source=link;artwork(art,image); cover=image
        result.append(dict(id=f'{id}-publico-{i}',name=title,kind='website',source=link,number=i,language=language))
    assert source,'sem episódios públicos confirmados'
    return dict(id=id,type='series',kind='website',name=name,year=year if year!='Animação' else '',genre=genre,description=desc,source=source,provider='YouTube',collection='series',access='Grátis no canal oficial. Pode ter anúncios ou restrição regional.',language=language,credit=author,art=art,artSource=cover,episodes=result)

def safe(fn,arg):
    try:return fn(arg)
    except Exception as e:print('Título omitido:',arg[0] if isinstance(arg,tuple) else arg,str(e)[:210]);return None
if __name__=='__main__':
    with ThreadPoolExecutor(max_workers=12) as pool:
        movies_br=list(pool.map(lambda x:safe(lambda a:ic('movies',a),x),IC_FILMS)); movies_yt=list(pool.map(lambda x:safe(film,x),YT_FILMS));series_yt=list(pool.map(lambda x:safe(serie,x),YT_SERIES+KIDS_SERIES)); series_br=list(pool.map(lambda x:safe(lambda a:ic('series',a),x),IC_SERIES))
    assert movies_br[0] and sum(x is not None for x in movies_br)>=10
    out=dict(movies=[x for x in movies_br+movies_yt if x],series=order_series([x for x in series_yt+series_br if x]))
    (ROOT/'catalogo-gratis.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
    print(len(out['movies']),'filmes;',len(out['series']),'séries;',sum(len(s.get('episodes',[])) for s in out['series']),'vídeos de séries com link individual.')
