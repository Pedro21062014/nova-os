package br.com.novaos.launcher;

public final class UpdateRulesTest {
    public static void main(String[] args) {
        equal(UpdateManager.normalizeRepo("https://github.com/NovaOwner/nova-os.git/"), "NovaOwner/nova-os");
        equal(UpdateManager.normalizeRepo(" owner/nova-os "), "owner/nova-os");
        equal(UpdateManager.normalizeRepo(""), "");
        for (String bad : new String[]{"https://otro.tld/team/app", "user/../repo", "user/..", "user/repo?tag=2", "user/repo%2Fother", "user@github.com/repo", "user/repo/releases"}) {
            rejects(() -> UpdateManager.normalizeRepo(bad));
        }
        equal(UpdateManager.compare("1.10.0", "1.9.9"), 1);
        equal(UpdateManager.compare("1.1.0", "1.1.0"), 0);
        equal(UpdateManager.compare("1.1.0", "1.1.1"), -1);
        rejects(() -> UpdateManager.compare("1.2.0-beta", "1.1.0"));
        rejects(() -> UpdateManager.compare(null, "1.1.0"));
        System.out.println("Regras Java de repositório e versão validadas.");
    }
    private static void equal(Object got, Object wanted) {
        if (!wanted.equals(got)) throw new AssertionError("Wanted " + wanted + ", got " + got);
    }
    private static void rejects(Runnable r) {
        try { r.run(); } catch (IllegalArgumentException expected) { return; }
        throw new AssertionError("Expected rejection");
    }
}
