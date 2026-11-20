package br.com.novaos.launcher;

public final class UpdateRulesTest {
    public static void main(String[] args) {
        String base="https://github.com/Pedro21062014/nova-os/releases/download/";
        equal(UpdateManager.initialAsset(base+"v1.2.7/Nova-OS-1.2.7-debug.apk"),true);
        equal(UpdateManager.initialAsset(base+"v1.2.7/Nova-OS.apk"),true);
        equal(UpdateManager.initialAsset(base+"1.2.7/Nova-OS-1.2.7.apk"),true);
        equal(UpdateManager.initialAsset(base.replace("Pedro21062014","another-owner")+"v1.2.7/Nova-OS.apk"),false);
        equal(UpdateManager.initialAsset(base.replace("https://", "http://")+"v1.2.7/Nova-OS.apk"),false);
        equal(UpdateManager.initialAsset(base+"nova-store-v1.0.4/Nova-Store-1.0.4.apk"),false);
        equal(UpdateManager.initialAsset(base+"v1.2.7/Nova-OS.apk?file=other"),false);
        equal(UpdateManager.initialAsset(base+"v1.2.7/../../Nova-OS.apk"),false);
        equal(UpdateManager.compare("1.10.0", "1.9.9"), 1);
        equal(UpdateManager.compare("1.1.0", "1.1.0"), 0);
        equal(UpdateManager.compare("1.1.0", "1.1.1"), -1);
        rejects(() -> UpdateManager.compare("1.2.0-beta", "1.1.0"));
        rejects(() -> UpdateManager.compare(null, "1.1.0"));
        System.out.println("Canal fixo, APK do Launcher e regras de versão validados.");
    }
    private static void equal(Object got, Object wanted) {
        if (!wanted.equals(got)) throw new AssertionError("Wanted " + wanted + ", got " + got);
    }
    private static void rejects(Runnable r) {
        try { r.run(); } catch (IllegalArgumentException expected) { return; }
        throw new AssertionError("Expected rejection");
    }
}
