package br.com.novaos.store;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;
import java.io.File;
import java.io.FileNotFoundException;

public final class StoreApkProvider extends ContentProvider {
    static final String MIME="application/vnd.android.package-archive";
    static File file(Context c,String token){return new File(c.getCacheDir(),"verified-"+token+".apk");}
    static Uri uri(Context c,String token){return Uri.parse("content://"+c.getPackageName()+".apk/"+token+".apk");}
    private File at(Uri uri){
        String name=uri.getLastPathSegment();
        if(getContext()==null||name==null||!name.matches("[a-f0-9]{32}\\.apk"))return null;
        String token=name.substring(0,32);return uri(getContext(),token).equals(uri)?file(getContext(),token):null;
    }
    @Override public boolean onCreate(){return true;}
    @Override public String getType(Uri uri){return at(uri)==null?null:MIME;}
    @Override public ParcelFileDescriptor openFile(Uri uri,String mode) throws FileNotFoundException {
        File path=at(uri);if(path==null||!"r".equals(mode))throw new FileNotFoundException();
        return ParcelFileDescriptor.open(path,ParcelFileDescriptor.MODE_READ_ONLY);
    }
    @Override public Cursor query(Uri uri,String[] columns,String selection,String[] args,String order){
        File path=at(uri);if(path==null||!path.isFile())return null;
        if(columns==null)columns=new String[]{OpenableColumns.DISPLAY_NAME,OpenableColumns.SIZE};
        Object[] values=new Object[columns.length];for(int i=0;i<columns.length;i++){
            if(OpenableColumns.DISPLAY_NAME.equals(columns[i]))values[i]="Nova-Store-download.apk";
            if(OpenableColumns.SIZE.equals(columns[i]))values[i]=path.length();
        }
        MatrixCursor cursor=new MatrixCursor(columns,1);cursor.addRow(values);return cursor;
    }
    @Override public Uri insert(Uri uri,ContentValues values){throw new UnsupportedOperationException();}
    @Override public int update(Uri uri,ContentValues values,String selection,String[] args){throw new UnsupportedOperationException();}
    @Override public int delete(Uri uri,String selection,String[] args){throw new UnsupportedOperationException();}
}
