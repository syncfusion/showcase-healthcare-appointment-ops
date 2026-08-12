using System.Collections.Concurrent;
using System.Reflection;
using Syncfusion.Pdf.Graphics;

namespace HealthcareAppointmentOps.Infrastructure.Pdf;

internal static class PdfBrand
{
    // Brand purple scale
    public static readonly PdfColor Brand600 = Hex(0x7E, 0x56, 0xD8); // --color-sf-brand-600 (primary)
    public static readonly PdfColor Brand700 = Hex(0x68, 0x40, 0xC6); // --color-sf-brand-700
    public static readonly PdfColor Brand500 = Hex(0x9D, 0x76, 0xED); // --color-sf-brand-500
    public static readonly PdfColor Brand100 = Hex(0xF4, 0xEB, 0xFF); // --color-sf-brand-100
    public static readonly PdfColor Brand50 = Hex(0xF9, 0xF5, 0xFF);  // --color-sf-brand-50

    // Status colors + light tints for pill fills
    public static readonly PdfColor Error600 = Hex(0xD9, 0x2C, 0x20);
    public static readonly PdfColor Error50 = Hex(0xFE, 0xF3, 0xF2);
    public static readonly PdfColor Warning600 = Hex(0xDB, 0x68, 0x03);
    public static readonly PdfColor Warning50 = Hex(0xFF, 0xFA, 0xEB);
    public static readonly PdfColor Success600 = Hex(0x06, 0x94, 0x54);
    public static readonly PdfColor Success50 = Hex(0xEC, 0xFD, 0xF3);

    // Neutrals
    public static readonly PdfColor FgPrimary = Hex(0x10, 0x18, 0x28);   // gray-900
    public static readonly PdfColor FgSecondary = Hex(0x34, 0x40, 0x54); // gray-700
    public static readonly PdfColor FgTertiary = Hex(0x47, 0x54, 0x67);  // gray-600
    public static readonly PdfColor FgQuaternary = Hex(0x66, 0x70, 0x85);// gray-500
    public static readonly PdfColor BorderPrimary = Hex(0xD0, 0xD5, 0xDD);
    public static readonly PdfColor BorderSecondary = Hex(0xEA, 0xEC, 0xF0);
    public static readonly PdfColor BgSecondary = Hex(0xF9, 0xFA, 0xFB);
    public static readonly PdfColor White = Hex(0xFF, 0xFF, 0xFF);

    // Frequently-reused brushes
    public static readonly PdfBrush BrandBrush = new PdfSolidBrush(Brand600);
    public static readonly PdfBrush WhiteBrush = new PdfSolidBrush(White);
    public static readonly PdfBrush FgPrimaryBrush = new PdfSolidBrush(FgPrimary);
    public static readonly PdfBrush FgSecondaryBrush = new PdfSolidBrush(FgSecondary);
    public static readonly PdfBrush FgTertiaryBrush = new PdfSolidBrush(FgTertiary);
    public static readonly PdfBrush FgQuaternaryBrush = new PdfSolidBrush(FgQuaternary);

    private static PdfColor Hex(byte r, byte g, byte b) => new(r, g, b);
}

/// <summary>Inter font weights embedded in this assembly.</summary>
internal enum InterWeight { Regular, Medium, SemiBold, Bold }

internal sealed class LabReportFonts
{
    private static readonly ConcurrentDictionary<InterWeight, byte[]?> ProgramCache = new();
    private readonly Dictionary<(InterWeight, float, bool), PdfFont> _fontCache = new();

    public PdfFont Get(InterWeight weight, float size, bool italic = false)
    {
        var key = (weight, size, italic);
        if (_fontCache.TryGetValue(key, out var cached))
            return cached;

        var style = italic ? PdfFontStyle.Italic : PdfFontStyle.Regular;
        var bytes = ProgramCache.GetOrAdd(weight, LoadProgram);

        PdfFont font = bytes is not null
            ? new PdfTrueTypeFont(new MemoryStream(bytes), size, style)
            : new PdfStandardFont(FallbackFamily(weight), size, FallbackStyle(weight, italic));

        _fontCache[key] = font;
        return font;
    }

    private static byte[]? LoadProgram(InterWeight weight)
    {
        var fileName = weight switch
        {
            InterWeight.Regular => "Inter-Regular.ttf",
            InterWeight.Medium => "Inter-Medium.ttf",
            InterWeight.SemiBold => "Inter-SemiBold.ttf",
            InterWeight.Bold => "Inter-Bold.ttf",
            _ => "Inter-Regular.ttf"
        };

        var asm = typeof(LabReportFonts).Assembly;
        var resourceName = asm.GetManifestResourceNames()
            .FirstOrDefault(n => n.EndsWith(fileName, StringComparison.OrdinalIgnoreCase));
        if (resourceName is null)
            return null;

        using var stream = asm.GetManifestResourceStream(resourceName);
        if (stream is null)
            return null;

        using var ms = new MemoryStream();
        stream.CopyTo(ms);
        return ms.ToArray();
    }

    private static PdfFontFamily FallbackFamily(InterWeight _) => PdfFontFamily.Helvetica;

    private static PdfFontStyle FallbackStyle(InterWeight weight, bool italic)
    {
        var bold = weight is InterWeight.SemiBold or InterWeight.Bold;
        if (bold && italic) return PdfFontStyle.Bold | PdfFontStyle.Italic;
        if (bold) return PdfFontStyle.Bold;
        if (italic) return PdfFontStyle.Italic;
        return PdfFontStyle.Regular;
    }
}
