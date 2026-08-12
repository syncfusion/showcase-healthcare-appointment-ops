using HealthcareAppointmentOps.Application.Abstractions;
using HealthcareAppointmentOps.Application.DTOs;
using HealthcareAppointmentOps.Domain.Common;
using HealthcareAppointmentOps.Domain.Entities;
using Syncfusion.Drawing;
using Syncfusion.Pdf;
using Syncfusion.Pdf.Barcode;
using Syncfusion.Pdf.Graphics;

namespace HealthcareAppointmentOps.Infrastructure.Pdf;

/// <summary>
/// Generates a patient-specific Laboratory Report PDF on the fly with the Syncfusion .NET PDF
/// library.
/// </summary>
public class LabReportPdfRenderer : IDocumentPdfRenderer
{
    private const float ResultRightX = 296f;
    private const float UnitBoxX = 302f;
    private const float UnitBoxW = 40f;
    private const float RefBoxX = 344f;
    private const float RefBoxW = 90f;
    private const float StatusColX = 436f;

    private static readonly PdfStringFormat LeftTop = new(PdfTextAlignment.Left, PdfVerticalAlignment.Top);
    private static readonly PdfStringFormat RightMiddle = new(PdfTextAlignment.Right, PdfVerticalAlignment.Middle);
    private static readonly PdfStringFormat CenterMiddle = new(PdfTextAlignment.Center, PdfVerticalAlignment.Middle);

    public DocumentPdfContent Render(Document document, Patient patient)
    {
        var branch = patient.PrimaryCareProvider?.Location;
        var pcp = patient.PrimaryCareProvider;

        var collected = document.UploadedDate;
        var reported = collected.AddMinutes(15);
        var reviewed = reported.AddMinutes(-40);

        var mrnDigits = new string(patient.MedicalRecordNumber.Where(char.IsDigit).ToArray());
        if (mrnDigits.Length < 6) mrnDigits = mrnDigits.PadLeft(6, '0');
        var reportNo = $"LAB-{reported:yyyy}-{mrnDigits[^6..]}";
        var accession = mrnDigits.PadLeft(8, '0');

        using var doc = new PdfDocument();
        doc.DocumentInformation.Author = LabReportContent.LabIdentity;
        doc.DocumentInformation.Creator = "Healthcare Appointment Ops Portal";
        doc.DocumentInformation.Title = $"{LabReportContent.PanelTitle} — {patient.LastName}, {patient.FirstName}";
        doc.DocumentInformation.Subject = LabReportContent.PanelSubtitle;
        doc.DocumentInformation.CreationDate = reported;
        doc.DocumentInformation.ModificationDate = reported;

        var section = doc.Sections.Add();
        section.PageSettings.Size = PdfPageSize.A4;
        section.PageSettings.Margins.All = 40f;

        var page = section.Pages.Add();
        var fonts = new LabReportFonts();
        var ctx = new LayoutCtx(section, page, fonts);

        BuildFooter(doc, ctx.Width, fonts, reportNo, reported);

        DrawLetterhead(ctx, branch, accession);
        DrawTitleBand(ctx);
        DrawOrderStrip(ctx, patient, pcp, reportNo, collected, reported);
        DrawPatientCard(ctx, patient, pcp, collected, mrnDigits);
        DrawResultsTable(ctx);
        DrawCallout(ctx, "Clinical Interpretation", LabReportContent.Interpretation);
        DrawCallout(ctx, "Additional Information", LabReportContent.AdditionalInformation);
        DrawSignatures(ctx, reviewed, reported);
        DrawConfidentialBand(ctx);

        using var ms = new MemoryStream();
        doc.Save(ms);
        var pageCount = doc.Pages.Count;
        doc.Close(true);
        var bytes = ms.ToArray();

        return new DocumentPdfContent
        {
            Content = bytes,
            FileName = $"LabReport_{patient.LastName}_{patient.MedicalRecordNumber}.pdf",
            ContentType = "application/pdf",
            PageCount = pageCount,
            SizeBytes = bytes.Length
        };
    }

    private static void DrawLetterhead(LayoutCtx ctx, Location? branch, string accession)
    {
        var g = ctx.G;
        float top = ctx.Y;

        DrawRoundedRect(g, new RectangleF(0, top, 34, 34), 8f, PdfBrand.BrandBrush, null);
        g.DrawString("M", ctx.F(InterWeight.Bold, 19), PdfBrand.WhiteBrush, new RectangleF(0, top, 34, 34), CenterMiddle);

        g.DrawString(Brand.OrganizationName, ctx.F(InterWeight.Bold, 16), PdfBrand.FgPrimaryBrush, new PointF(44, top));
        g.DrawString(LabReportContent.LabDivision, ctx.F(InterWeight.Regular, 8.5f),
            new PdfSolidBrush(PdfBrand.FgTertiary), new PointF(44, top + 21));

        var contactFont = ctx.F(InterWeight.Regular, 7.5f);
        var contactBrush = new PdfSolidBrush(PdfBrand.FgQuaternary);
        float cy = top + 36;
        if (branch is not null)
        {
            g.DrawString(branch.AddressLine, contactFont, contactBrush, new PointF(44, cy));
            g.DrawString($"{branch.City}, {branch.State} {branch.PostalCode}", contactFont, contactBrush, new PointF(44, cy + 10));
            g.DrawString($"Tel {branch.PhoneNumber}   •   {LabReportContent.LabEmail}   •   {LabReportContent.LabWeb}",
                contactFont, contactBrush, new PointF(44, cy + 20));
        }
        else
        {
            g.DrawString($"{LabReportContent.LabEmail}   •   {LabReportContent.LabWeb}", contactFont, contactBrush, new PointF(44, cy));
        }

        var barcode = new PdfCode39Barcode
        {
            Text = accession,
            Location = new PointF(ctx.Width - 150, top),
            Size = new SizeF(150, 34)
        };
        barcode.Draw(ctx.Page);

        ctx.Y = top + 74;
        DrawRule(g, ctx.Y, ctx.Width);
        ctx.Y += 14;
    }

    private static void DrawTitleBand(LayoutCtx ctx)
    {
        var g = ctx.G;
        var titleFmt = new PdfStringFormat(PdfTextAlignment.Center, PdfVerticalAlignment.Middle) { CharacterSpacing = 3f };
        var subFmt = new PdfStringFormat(PdfTextAlignment.Center, PdfVerticalAlignment.Middle) { CharacterSpacing = 2f };

        g.DrawString(LabReportContent.PanelTitle.ToUpperInvariant(), ctx.F(InterWeight.Bold, 21),
            PdfBrand.BrandBrush, new RectangleF(0, ctx.Y, ctx.Width, 30), titleFmt);
        ctx.Y += 30;
        g.DrawString(LabReportContent.PanelSubtitle.ToUpperInvariant(), ctx.F(InterWeight.Medium, 8.5f),
            new PdfSolidBrush(PdfBrand.FgQuaternary), new RectangleF(0, ctx.Y, ctx.Width, 14), subFmt);
        ctx.Y += 26;
    }

    private static void DrawOrderStrip(LayoutCtx ctx, Patient patient, Provider? pcp, string reportNo, DateTime collected, DateTime reported)
    {
        var g = ctx.G;
        DrawRule(g, ctx.Y, ctx.Width);
        ctx.Y += 10;

        var physician = pcp is not null ? $"Dr. {pcp.FirstName} {pcp.LastName}, {pcp.Title}" : "—";
        var specialty = pcp?.Specialty ?? LabReportContent.OrderingGroupFallback;
        var orderingGroup = pcp?.Department?.DepartmentName is { Length: > 0 } dn ? dn : $"{specialty} Group";

        float colW = ctx.Width / 2f;
        float leftX = 0, rightX = colW + 10;
        float y = ctx.Y;
        InlineField(ctx, leftX, y, "Ordering", orderingGroup);
        InlineField(ctx, rightX, y, "Report No", reportNo);
        InlineField(ctx, leftX, y + 15, "Physician", $"{physician}  ({specialty})");
        InlineField(ctx, rightX, y + 15, "Collection Date", collected.ToString("yyyy-MM-dd hh:mm tt"));
        InlineField(ctx, leftX, y + 30, "Collected By", LabReportContent.CollectedBy);
        InlineField(ctx, rightX, y + 30, "Report Date", reported.ToString("yyyy-MM-dd hh:mm tt"));

        ctx.Y = y + 44;
        DrawRule(g, ctx.Y, ctx.Width);
        ctx.Y += 16;
    }

    private static void DrawPatientCard(LayoutCtx ctx, Patient patient, Provider? pcp, DateTime asOf, string mrnDigits)
    {
        const float pad = 14f;
        const float rowH = 30f;
        float titleH = 20f;
        float cardH = titleH + rowH * 3 + 26f + pad; // 3 KV rows + full-width conditions line

        ctx.EnsureSpace(cardH + 8);
        var g = ctx.G; // capture AFTER EnsureSpace — a page break swaps ctx.G
        float top = ctx.Y;
        var card = new RectangleF(0, top, ctx.Width, cardH);
        DrawRoundedRect(g, card, 8f, new PdfSolidBrush(PdfBrand.Brand50), null);
        DrawRoundedRect(g, new RectangleF(0, top, 4, cardH), 2f, PdfBrand.BrandBrush, null);

        float innerX = pad + 4;
        float innerW = ctx.Width - innerX - pad;
        var lsp = new PdfStringFormat(PdfTextAlignment.Left, PdfVerticalAlignment.Middle) { CharacterSpacing = 1.5f };
        g.DrawString("PATIENT INFORMATION", ctx.F(InterWeight.SemiBold, 8.5f),
            new PdfSolidBrush(PdfBrand.Brand700), new RectangleF(innerX, top + pad - 4, innerW, 14), lsp);

        float colW = innerW / 3f;
        float y0 = top + titleH + 4;
        var age = asOf.Year - patient.DateOfBirth.Year - (asOf.DayOfYear < patient.DateOfBirth.DayOfYear ? 1 : 0);
        var pcpName = pcp is not null ? $"Dr. {pcp.FirstName} {pcp.LastName}" : "—";

        KeyValue(ctx, innerX, y0, colW, "Name", $"{patient.FirstName} {patient.LastName}");
        KeyValue(ctx, innerX + colW, y0, colW, "Date of Birth", patient.DateOfBirth.ToString("MMMM d, yyyy"));
        KeyValue(ctx, innerX + 2 * colW, y0, colW, "Age / Gender", $"{age} / {patient.Gender}");

        KeyValue(ctx, innerX, y0 + rowH, colW, "MRN", patient.MedicalRecordNumber);
        KeyValue(ctx, innerX + colW, y0 + rowH, colW, "Patient ID", $"PT-{mrnDigits[^Math.Min(6, mrnDigits.Length)..]}");
        KeyValue(ctx, innerX + 2 * colW, y0 + rowH, colW,
            "Address", $"{patient.AddressLine}, {patient.City}, {patient.State} {patient.PostalCode}".Trim(' ', ','));

        KeyValue(ctx, innerX, y0 + rowH * 2, colW, "Primary Care Provider", pcpName);
        KeyValue(ctx, innerX + colW, y0 + rowH * 2, colW, "Fasting Status", LabReportContent.FastingStatus);
        KeyValue(ctx, innerX + 2 * colW, y0 + rowH * 2, colW, "Insurance", patient.InsuranceType);

        KeyValue(ctx, innerX, y0 + rowH * 3, innerW, "Active Conditions", LabReportContent.ActiveConditions);

        ctx.Y = top + cardH + 18;
    }

    private static void DrawResultsTable(LayoutCtx ctx)
    {
        DrawResultsHeader(ctx);
        foreach (var section in LabReportContent.Sections)
        {
            if (ctx.EnsureSpace(18 + 34)) DrawResultsHeader(ctx);
            DrawSectionBand(ctx, section.Title);
            foreach (var row in section.Rows)
            {
                float rh = row.Method is not null ? 40f : 30f;
                if (ctx.EnsureSpace(rh)) DrawResultsHeader(ctx);
                DrawResultRow(ctx, row, rh);
            }
        }
        ctx.Y += 12;
    }

    private static void DrawResultsHeader(LayoutCtx ctx)
    {
        var g = ctx.G;
        float h = 22f;
        DrawRoundedRect(g, new RectangleF(0, ctx.Y, ctx.Width, h), 4f, PdfBrand.BrandBrush, null);
        var f = ctx.F(InterWeight.SemiBold, 7.5f);
        var fmt = new PdfStringFormat(PdfTextAlignment.Left, PdfVerticalAlignment.Middle) { CharacterSpacing = 0.5f };
        var cfmt = new PdfStringFormat(PdfTextAlignment.Center, PdfVerticalAlignment.Middle) { CharacterSpacing = 0.5f };
        var rfmt = new PdfStringFormat(PdfTextAlignment.Right, PdfVerticalAlignment.Middle) { CharacterSpacing = 0.5f };
        var b = PdfBrand.WhiteBrush;
        float y = ctx.Y;
        g.DrawString("TEST NAME", f, b, new RectangleF(12, y, 220, h), fmt);
        g.DrawString("RESULT", f, b, new RectangleF(180, y, ResultRightX - 180, h), rfmt);
        g.DrawString("UNIT", f, b, new RectangleF(UnitBoxX, y, UnitBoxW, h), cfmt);
        g.DrawString("REFERENCE RANGE", f, b, new RectangleF(RefBoxX, y, RefBoxW, h), cfmt);
        g.DrawString("STATUS", f, b, new RectangleF(StatusColX, y, ctx.Width - StatusColX - 8, h), rfmt);
        ctx.Y += h + 4;
    }

    private static void DrawSectionBand(LayoutCtx ctx, string title)
    {
        var g = ctx.G;
        float h = 17f;
        DrawRoundedRect(g, new RectangleF(0, ctx.Y, ctx.Width, h), 3f, new PdfSolidBrush(PdfBrand.Brand50), null);
        var fmt = new PdfStringFormat(PdfTextAlignment.Left, PdfVerticalAlignment.Middle) { CharacterSpacing = 1.2f };
        g.DrawString(title.ToUpperInvariant(), ctx.F(InterWeight.SemiBold, 7.5f),
            new PdfSolidBrush(PdfBrand.Brand700), new RectangleF(12, ctx.Y, ctx.Width - 20, h), fmt);
        ctx.Y += h + 3;
    }

    private static void DrawResultRow(LayoutCtx ctx, Analyte row, float rh)
    {
        var g = ctx.G;
        float top = ctx.Y;
        float lineY = top + 6;

        g.DrawString(row.Test, ctx.F(InterWeight.SemiBold, 9.5f), PdfBrand.FgPrimaryBrush, new PointF(12, top));
        g.DrawString($"ICD-10: {row.Icd}", ctx.F(InterWeight.Regular, 7f),
            new PdfSolidBrush(PdfBrand.FgQuaternary), new PointF(12, top + 13));
        if (row.Method is not null)
        {
            g.DrawString(row.Method, ctx.F(InterWeight.Regular, 7f, italic: true),
                new PdfSolidBrush(PdfBrand.FgTertiary), new RectangleF(12, top + 23, 290, 12), LeftTop);
        }

        var valFont = ctx.F(InterWeight.SemiBold, 9.5f);
        var valBrush = row.Flag is LabFlag.High or LabFlag.Low ? new PdfSolidBrush(PdfBrand.Error600) : PdfBrand.FgPrimaryBrush;
        g.DrawString(row.Result, valFont, valBrush, new RectangleF(180, lineY - 6, ResultRightX - 180, 14), RightMiddle);
        g.DrawString(row.Unit, ctx.F(InterWeight.Regular, 8.5f), PdfBrand.FgTertiaryBrush, new RectangleF(UnitBoxX, lineY - 6, UnitBoxW, 14), CenterMiddle);
        g.DrawString(row.ReferenceRange, ctx.F(InterWeight.Regular, 8.5f), PdfBrand.FgTertiaryBrush,
            new RectangleF(RefBoxX, lineY - 6, RefBoxW, 14), CenterMiddle);

        DrawStatusPill(ctx, row.Flag, new RectangleF(StatusColX, lineY - 8, ctx.Width - StatusColX, 16));

        // Row divider.
        var pen = new PdfPen(new PdfSolidBrush(PdfBrand.BorderSecondary), 0.5f);
        g.DrawLine(pen, new PointF(0, top + rh - 4), new PointF(ctx.Width, top + rh - 4));
        ctx.Y = top + rh;
    }

    private static void DrawStatusPill(LayoutCtx ctx, LabFlag flag, RectangleF area)
    {
        var g = ctx.G;
        var (fg, bg) = flag switch
        {
            LabFlag.High or LabFlag.Low => (PdfBrand.Error600, PdfBrand.Error50),
            LabFlag.Borderline => (PdfBrand.Warning600, PdfBrand.Warning50),
            _ => (PdfBrand.Success600, PdfBrand.Success50)
        };
        var text = LabReportContent.FlagText(flag);
        var font = ctx.F(InterWeight.SemiBold, 7f);
        float tw = font.MeasureString(text).Width;
        float pillW = tw + 16;
        float pillH = 14.5f;
        float px = area.Right - pillW;
        float py = area.Y + (area.Height - pillH) / 2f;
        var pill = new RectangleF(px, py, pillW, pillH);
        DrawRoundedRect(g, pill, pillH / 2f, new PdfSolidBrush(bg), new PdfPen(new PdfSolidBrush(fg), 0.75f));
        g.DrawString(text, font, new PdfSolidBrush(fg), pill, CenterMiddle);
    }

    private static void DrawCallout(LayoutCtx ctx, string title, string body)
    {
        var bodyFont = ctx.F(InterWeight.Regular, 8.5f);
        float innerW = ctx.Width - 28;
        var bodyFmt = new PdfStringFormat(PdfTextAlignment.Left, PdfVerticalAlignment.Top) { LineSpacing = 3f };
        float bodyH = MeasureHeight(body, bodyFont, innerW, bodyFmt);
        float boxH = 20f + bodyH + 16f;

        ctx.EnsureSpace(boxH + 10);
        var g = ctx.G; // capture AFTER EnsureSpace — a page break swaps ctx.G
        float top = ctx.Y;
        DrawRoundedRect(g, new RectangleF(0, top, ctx.Width, boxH), 6f, new PdfSolidBrush(PdfBrand.Brand50), null);
        DrawRoundedRect(g, new RectangleF(0, top, 4, boxH), 2f, PdfBrand.BrandBrush, null);

        var lsp = new PdfStringFormat(PdfTextAlignment.Left, PdfVerticalAlignment.Middle) { CharacterSpacing = 0.8f };
        g.DrawString(title, ctx.F(InterWeight.SemiBold, 9.5f), new PdfSolidBrush(PdfBrand.Brand700),
            new RectangleF(16, top + 10, innerW, 14), lsp);
        g.DrawString(body, bodyFont, PdfBrand.FgSecondaryBrush, new RectangleF(16, top + 26, innerW, bodyH + 4), bodyFmt);
        ctx.Y = top + boxH + 14;
    }

    private static void DrawSignatures(LayoutCtx ctx, DateTime reviewed, DateTime authorized)
    {
        ctx.EnsureSpace(88);
        float top = ctx.Y + 8;
        float colW = ctx.Width / 2f;
        SignatureBlock(ctx, 0, top, colW - 20, LabReportContent.Reviewer, reviewed);
        SignatureBlock(ctx, colW + 10, top, colW - 20, LabReportContent.Authorizer, authorized);
        ctx.Y = top + 80;
    }

    private static void SignatureBlock(LayoutCtx ctx, float x, float y, float w, Signatory s, DateTime when)
    {
        var g = ctx.G;
        g.DrawString(s.Name, ctx.F(InterWeight.SemiBold, 15f, italic: true), PdfBrand.FgPrimaryBrush,
            new RectangleF(x, y, w, 22), CenterMiddle);
        var pen = new PdfPen(new PdfSolidBrush(PdfBrand.BorderPrimary), 0.6f);
        g.DrawLine(pen, new PointF(x + 20, y + 26), new PointF(x + w - 20, y + 26));

        var cfmt = new PdfStringFormat(PdfTextAlignment.Center, PdfVerticalAlignment.Top);
        var capFmt = new PdfStringFormat(PdfTextAlignment.Center, PdfVerticalAlignment.Top) { CharacterSpacing = 0.6f };
        g.DrawString(s.Name, ctx.F(InterWeight.SemiBold, 8.5f), PdfBrand.FgPrimaryBrush, new RectangleF(x, y + 30, w, 12), cfmt);
        g.DrawString(s.Credentials, ctx.F(InterWeight.Regular, 7.5f), PdfBrand.FgTertiaryBrush, new RectangleF(x, y + 41, w, 12), cfmt);
        g.DrawString(s.Role.ToUpperInvariant(), ctx.F(InterWeight.Regular, 6.5f), PdfBrand.FgQuaternaryBrush, new RectangleF(x, y + 51, w, 10), capFmt);
        g.DrawString($"{s.Action}: {when:yyyy-MM-dd hh:mm tt}", ctx.F(InterWeight.Regular, 7f), PdfBrand.FgTertiaryBrush, new RectangleF(x, y + 61, w, 10), cfmt);
        g.DrawString(s.Verification, ctx.F(InterWeight.Regular, 7f, italic: true), new PdfSolidBrush(PdfBrand.Brand600), new RectangleF(x, y + 70, w, 10), cfmt);
    }

    private static void DrawConfidentialBand(LayoutCtx ctx)
    {
        var bodyFont = ctx.F(InterWeight.Regular, 7.5f);
        var bodyFmt = new PdfStringFormat(PdfTextAlignment.Center, PdfVerticalAlignment.Top) { LineSpacing = 2f };
        float innerW = ctx.Width - 32;
        float bodyH = MeasureHeight(LabReportContent.ConfidentialBody, bodyFont, innerW, bodyFmt);
        float boxH = 16f + bodyH + 14f;

        ctx.EnsureSpace(boxH + 6);
        var g = ctx.G; // capture AFTER EnsureSpace — a page break swaps ctx.G
        float top = ctx.Y;
        DrawRoundedRect(g, new RectangleF(0, top, ctx.Width, boxH), 6f, new PdfSolidBrush(PdfBrand.BgSecondary), null);
        var titleFmt = new PdfStringFormat(PdfTextAlignment.Center, PdfVerticalAlignment.Middle) { CharacterSpacing = 1f };
        g.DrawString(LabReportContent.ConfidentialTitle, ctx.F(InterWeight.SemiBold, 7.5f),
            new PdfSolidBrush(PdfBrand.Error600), new RectangleF(16, top + 8, innerW, 12), titleFmt);
        g.DrawString(LabReportContent.ConfidentialBody, bodyFont, PdfBrand.FgTertiaryBrush,
            new RectangleF(16, top + 22, innerW, bodyH + 4), bodyFmt);
        ctx.Y = top + boxH + 6;
    }

    private static void BuildFooter(PdfDocument doc, float width, LabReportFonts fonts, string reportNo, DateTime generated)
    {
        var bounds = new RectangleF(0, 0, width, 26);
        var footer = new PdfPageTemplateElement(bounds);
        var g = footer.Graphics;
        var font = fonts.Get(InterWeight.Regular, 7f);
        var brush = new PdfSolidBrush(PdfBrand.FgQuaternary);

        g.DrawLine(new PdfPen(new PdfSolidBrush(PdfBrand.BorderSecondary), 0.5f), new PointF(0, 4), new PointF(width, 4));
        g.DrawString($"{LabReportContent.LabIdentity}   •   Laboratory Report", font, brush, new PointF(0, 10));

        var pageNumber = new PdfPageNumberField(font, brush);
        var pageCount = new PdfPageCountField(font, brush);
        var composite = new PdfCompositeField(font, brush,
            $"Report No {reportNo}   •   Generated {generated:yyyy-MM-dd HH:mm}   •   Page {{0}} of {{1}}", pageNumber, pageCount)
        {
            Bounds = bounds,
            StringFormat = new PdfStringFormat(PdfTextAlignment.Right, PdfVerticalAlignment.Top)
        };
        composite.Draw(g, new PointF(0, 10));
        doc.Template.Bottom = footer;
    }

    private static void InlineField(LayoutCtx ctx, float x, float y, string label, string value)
    {
        var g = ctx.G;
        g.DrawString(label, ctx.F(InterWeight.Regular, 7.5f), new PdfSolidBrush(PdfBrand.FgQuaternary), new PointF(x, y));
        g.DrawString(value, ctx.F(InterWeight.SemiBold, 8.5f), PdfBrand.FgPrimaryBrush, new PointF(x + 88, y));
    }

    private static void KeyValue(LayoutCtx ctx, float x, float y, float w, string label, string value)
    {
        var g = ctx.G;
        g.DrawString(label, ctx.F(InterWeight.Regular, 7f), new PdfSolidBrush(PdfBrand.FgQuaternary), new RectangleF(x, y, w, 10), LeftTop);
        g.DrawString(value, ctx.F(InterWeight.SemiBold, 9f), PdfBrand.FgPrimaryBrush, new RectangleF(x, y + 10, w, 16), LeftTop);
    }

    private static void DrawRule(PdfGraphics g, float y, float width)
    {
        g.DrawLine(new PdfPen(new PdfSolidBrush(PdfBrand.BorderSecondary), 0.75f), new PointF(0, y), new PointF(width, y));
    }

    private static float MeasureHeight(string text, PdfFont font, float width, PdfStringFormat format)
    {
        var layouter = new PdfStringLayouter();
        var result = layouter.Layout(text, font, format, new SizeF(width, 10000f));
        return result.ActualSize.Height;
    }

    private static void DrawRoundedRect(PdfGraphics g, RectangleF r, float radius, PdfBrush? fill, PdfPen? border)
    {
        float d = Math.Min(radius * 2f, Math.Min(r.Width, r.Height));
        var path = new PdfPath();
        path.AddArc(r.X, r.Y, d, d, 180, 90);
        path.AddArc(r.Right - d, r.Y, d, d, 270, 90);
        path.AddArc(r.Right - d, r.Bottom - d, d, d, 0, 90);
        path.AddArc(r.X, r.Bottom - d, d, d, 90, 90);
        path.CloseFigure();

        if (fill is not null && border is not null) g.DrawPath(border, fill, path);
        else if (fill is not null) g.DrawPath(fill, path);
        else if (border is not null) g.DrawPath(border, path);
    }

    private sealed class LayoutCtx
    {
        private readonly PdfSection _section;
        private readonly LabReportFonts _fonts;

        public PdfPage Page { get; private set; }
        public PdfGraphics G { get; private set; }
        public float Y { get; set; }
        public float Width { get; }
        public float Bottom { get; }

        public LayoutCtx(PdfSection section, PdfPage page, LabReportFonts fonts)
        {
            _section = section;
            _fonts = fonts;
            Page = page;
            G = page.Graphics;
            var size = page.GetClientSize();
            Width = size.Width;
            Bottom = size.Height;
            Y = 0f;
        }

        public PdfFont F(InterWeight weight, float size, bool italic = false) => _fonts.Get(weight, size, italic);

        /// <summary>Adds a page and resets the cursor if <paramref name="needed"/> won't fit. Returns true if a page break occurred.</summary>
        public bool EnsureSpace(float needed)
        {
            if (Y + needed <= Bottom) return false;
            Page = _section.Pages.Add();
            G = Page.Graphics;
            Y = 0f;
            return true;
        }
    }
}
