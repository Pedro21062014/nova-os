package br.com.novaos.launcher;

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

/** A read-only, permission-granted URI for the APK paths staged by Nova OS. */
public final class UpdateFileProvider extends ContentProvider {
    static final String MIME = "application/vnd.android.package-archive";
    static File staged(Context c) { return new File(c.getCacheDir(), "nova-update.apk"); }
    static Uri uri(Context c) { return Uri.parse("content://" + c.getPackageName() + ".update/nova-update.apk"); }
    static File storeStaged(Context c) { return new File(c.getCacheDir(), "nova-store.apk"); }
    static Uri storeUri(Context c) { return Uri.parse("content://" + c.getPackageName() + ".update/nova-store.apk"); }
    static File iptvStaged(Context c) { return new File(c.getCacheDir(), "nova-iptv.apk"); }
    static Uri iptvUri(Context c) { return Uri.parse("content://" + c.getPackageName() + ".update/nova-iptv.apk"); }
    private File file(Uri u) {
        Context c=getContext();
        if(c==null)return null;
        if(uri(c).equals(u))return staged(c);
        if(storeUri(c).equals(u))return storeStaged(c);
        if(iptvUri(c).equals(u))return iptvStaged(c);
        return null;
    }
    @Override public boolean onCreate() { return true; }
    @Override public String getType(Uri u) { return file(u) != null ? MIME : null; }
    @Override public ParcelFileDescriptor openFile(Uri u, String mode) throws FileNotFoundException {
        File apk=file(u);
        if (apk==null || !"r".equals(mode)) throw new FileNotFoundException();
        return ParcelFileDescriptor.open(apk, ParcelFileDescriptor.MODE_READ_ONLY);
    }
    @Override public Cursor query(Uri u, String[] columns, String selection, String[] args, String order) {
        File apk=file(u);
        if (apk==null || !apk.isFile()) return null;
        if (columns == null) columns = new String[]{OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE};
        MatrixCursor cursor = new MatrixCursor(columns, 1);
        Object[] values = new Object[columns.length];
        for (int i=0;i<columns.length;i++) {
            if (OpenableColumns.DISPLAY_NAME.equals(columns[i])) values[i]=storeUri(getContext()).equals(u)?"Nova-Store.apk":iptvUri(getContext()).equals(u)?"Nova-IPTV.apk":"Nova-OS.apk";
            if (OpenableColumns.SIZE.equals(columns[i])) values[i]=apk.length();
        }
        cursor.addRow(values);
        return cursor;
    }
    @Override public Uri insert(Uri u, ContentValues v) { throw new UnsupportedOperationException(); }
    @Override public int delete(Uri u, String s, String[] a) { throw new UnsupportedOperationException(); }
    @Override public int update(Uri u, ContentValues v, String s, String[] a) { throw new UnsupportedOperationException(); }
}
