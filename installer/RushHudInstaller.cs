using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Windows.Forms;

internal static class RushHudInstaller
{
    private const string HudFolderName = "rush-hud";

    [STAThread]
    private static int Main(string[] args)
    {
        bool quiet = HasArgument(args, "/quiet") || HasArgument(args, "/s");
        string explicitTarget = ArgumentValue(args, "/target=");
        string logPath = ArgumentValue(args, "/log=");
        List<string> targets = explicitTarget == null ? DefaultTargets() : new List<string> { Path.GetFullPath(explicitTarget) };

        if (!quiet)
        {
            DialogResult answer = MessageBox.Show(
                "Install or update RUSH Live for JT Hud?\n\nCustom images, uploads, and images.json will be preserved. Existing HUD folders will be kept as timestamped backups.",
                "RUSH Live for JT Hud",
                MessageBoxButtons.OKCancel,
                MessageBoxIcon.Information);
            if (answer != DialogResult.OK) return 2;
        }

        var installed = new List<string>();
        var backups = new List<string>();
        try
        {
            foreach (string target in targets)
            {
                string backup = InstallTarget(target);
                installed.Add(target);
                if (backup != null) backups.Add(backup);
            }

            if (!quiet)
            {
                string message = "RUSH Live for JT Hud was installed to:\n\n" + string.Join("\n", installed.ToArray());
                if (backups.Count > 0) message += "\n\nBackups:\n" + string.Join("\n", backups.ToArray());
                message += "\n\nRefresh the OBS browser source or restart JT Hud Manager.";
                MessageBox.Show(message, "Installation complete", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            return 0;
        }
        catch (Exception error)
        {
            if (logPath != null) File.WriteAllText(logPath, error.ToString());
            if (!quiet)
                MessageBox.Show(error.Message, "Installation failed", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return 1;
        }
    }

    private static List<string> DefaultTargets()
    {
        var targets = new List<string>();
        targets.Add(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "jthm-huds", HudFolderName));

        string managerTarget = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "Programs", "jts-hud-rush-manager", "resources", HudFolderName);
        if (Directory.Exists(managerTarget)) targets.Add(managerTarget);
        return targets;
    }

    private static string InstallTarget(string target)
    {
        string parent = Path.GetDirectoryName(target);
        if (string.IsNullOrEmpty(parent)) throw new InvalidOperationException("Invalid installation target: " + target);
        Directory.CreateDirectory(parent);

        string stage = target + ".installing-" + Guid.NewGuid().ToString("N");
        string backup = null;
        try
        {
            Directory.CreateDirectory(stage);
            ExtractEmbeddedArchive(stage);

            if (Directory.Exists(target))
            {
                Preserve(Path.Combine(target, "assets", "custom"), Path.Combine(stage, "assets", "custom"));
                Preserve(Path.Combine(target, "uploads"), Path.Combine(stage, "uploads"));
                PreserveFile(Path.Combine(target, "images.json"), Path.Combine(stage, "images.json"));
                backup = UniqueBackupPath(target);
                Directory.Move(target, backup);
            }

            try
            {
                Directory.Move(stage, target);
            }
            catch
            {
                if (backup != null && Directory.Exists(backup) && !Directory.Exists(target))
                    Directory.Move(backup, target);
                throw;
            }
            return backup;
        }
        finally
        {
            if (Directory.Exists(stage)) Directory.Delete(stage, true);
        }
    }

    private static void ExtractEmbeddedArchive(string destination)
    {
        Stream resource = Assembly.GetExecutingAssembly().GetManifestResourceStream("RushHud.zip");
        if (resource == null) throw new InvalidOperationException("The embedded HUD package is missing.");
        using (resource)
        using (var archive = new ZipArchive(resource, ZipArchiveMode.Read))
        {
            string root = Path.GetFullPath(destination + Path.DirectorySeparatorChar);
            foreach (ZipArchiveEntry entry in archive.Entries)
            {
                string path = Path.GetFullPath(Path.Combine(destination, entry.FullName));
                if (!path.StartsWith(root, StringComparison.OrdinalIgnoreCase))
                    throw new InvalidDataException("The HUD package contains an invalid path.");
                if (string.IsNullOrEmpty(entry.Name))
                {
                    Directory.CreateDirectory(path);
                    continue;
                }
                string directory = Path.GetDirectoryName(path);
                if (!string.IsNullOrEmpty(directory)) Directory.CreateDirectory(directory);
                entry.ExtractToFile(path, true);
            }
        }
    }

    private static void Preserve(string source, string destination)
    {
        if (!Directory.Exists(source)) return;
        Directory.CreateDirectory(destination);
        foreach (string directory in Directory.GetDirectories(source, "*", SearchOption.AllDirectories))
            Directory.CreateDirectory(directory.Replace(source, destination));
        foreach (string file in Directory.GetFiles(source, "*", SearchOption.AllDirectories))
        {
            string output = file.Replace(source, destination);
            Directory.CreateDirectory(Path.GetDirectoryName(output));
            File.Copy(file, output, true);
        }
    }

    private static void PreserveFile(string source, string destination)
    {
        if (!File.Exists(source)) return;
        Directory.CreateDirectory(Path.GetDirectoryName(destination));
        File.Copy(source, destination, true);
    }

    private static string UniqueBackupPath(string target)
    {
        string basePath = target + ".backup-" + DateTime.Now.ToString("yyyyMMdd-HHmmss");
        string candidate = basePath;
        int suffix = 2;
        while (Directory.Exists(candidate)) candidate = basePath + "-" + suffix++;
        return candidate;
    }

    private static bool HasArgument(string[] args, string expected)
    {
        foreach (string arg in args)
            if (string.Equals(arg, expected, StringComparison.OrdinalIgnoreCase)) return true;
        return false;
    }

    private static string ArgumentValue(string[] args, string prefix)
    {
        foreach (string arg in args)
            if (arg.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)) return arg.Substring(prefix.Length).Trim('"');
        return null;
    }
}
