import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle, WidthType } from 'docx';
import { CodeReview } from '../models/review.model.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Generate PDF Code Review Report
 * @route GET /api/reports/:id/pdf
 */
export const generatePdfReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await CodeReview.findOne({ _id: id, user: req.user._id });

    if (!review) {
      return next(new ApiError(404, 'Code review not found'));
    }

    const doc = new PDFDocument({ margin: 50 });

    // Set Response Headers for PDF Download
    const filename = `CodeReview_${review.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Header Title
    doc.fillColor('#312e81').fontSize(22).text('AI Code Review Report', { align: 'center' });
    doc.moveDown(0.5);

    // Meta Info Card
    doc.fillColor('#1e293b').fontSize(14).text(`Title: ${review.title}`);
    doc.fontSize(10).fillColor('#64748b').text(`Language: ${review.language} | Date: ${new Date(review.createdAt).toLocaleDateString()}`);
    doc.moveDown(1);

    // Score Badge Box
    doc.rect(50, doc.y, 500, 45).fillAndStroke('#f1f5f9', '#cbd5e1');
    doc.fillColor('#0f172a').fontSize(12).text(`Overall Code Quality Score: ${review.score} / 100`, 65, doc.y - 32);
    doc.fontSize(9).fillColor('#475569').text(`Time Complexity: ${review.complexity?.timeComplexity || 'O(N)'} | Space Complexity: ${review.complexity?.spaceComplexity || 'O(1)'}`, 65, doc.y + 4);
    doc.moveDown(2);

    // Summary Section
    doc.fillColor('#4338ca').fontSize(14).text('1. Executive Summary');
    doc.fillColor('#334155').fontSize(10).text(review.aiFeedback || 'N/A', { lineGap: 4 });
    doc.moveDown(1.5);

    // Suggestions Section
    doc.fillColor('#4338ca').fontSize(14).text('2. Actionable AI Suggestions');
    if (review.suggestions && review.suggestions.length) {
      review.suggestions.forEach((sug) => {
        doc.fillColor('#334155').fontSize(10).text(`• ${sug}`, { indent: 10 });
      });
    } else {
      doc.fillColor('#334155').fontSize(10).text('• Maintain modular unit testing routines.');
    }
    doc.moveDown(1.5);

    // Original Code Section
    doc.fillColor('#4338ca').fontSize(14).text('3. Original Submitted Code');
    doc.fillColor('#0f172a').font('Courier').fontSize(8).text(review.originalCode, {
      background: '#f8fafc',
    });
    doc.moveDown(1.5);

    // Optimized Code Section
    doc.font('Helvetica');
    doc.fillColor('#4338ca').fontSize(14).text('4. Optimized Refactored Code');
    doc.fillColor('#065f46').font('Courier').fontSize(8).text(review.reviewedCode || review.originalCode, {
      background: '#ecfdf5',
    });

    doc.end();
  } catch (error) {
    next(error);
  }
};

/**
 * Generate DOCX Word Code Review Report
 * @route GET /api/reports/:id/docx
 */
export const generateDocxReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await CodeReview.findOne({ _id: id, user: req.user._id });

    if (!review) {
      return next(new ApiError(404, 'Code review not found'));
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: `AI Code Review Report: ${review.title}`,
              heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Language: ${review.language} | `, bold: true }),
                new TextRun({ text: `Quality Score: ${review.score}/100 | `, bold: true, color: '059669' }),
                new TextRun({ text: `Date: ${new Date(review.createdAt).toLocaleDateString()}` }),
              ],
            }),
            new Paragraph({ text: '' }),
            new Paragraph({
              text: 'Executive Summary',
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              text: review.aiFeedback || 'N/A',
            }),
            new Paragraph({ text: '' }),
            new Paragraph({
              text: 'Algorithmic Complexity',
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              text: `Time Complexity: ${review.complexity?.timeComplexity || 'O(N)'} | Space Complexity: ${review.complexity?.spaceComplexity || 'O(1)'}`,
            }),
            new Paragraph({ text: '' }),
            new Paragraph({
              text: 'Actionable AI Suggestions',
              heading: HeadingLevel.HEADING_2,
            }),
            ...(review.suggestions && review.suggestions.length
              ? review.suggestions.map((s) => new Paragraph({ text: `• ${s}` }))
              : [new Paragraph({ text: '• Maintain clean modular code practices.' })]),
            new Paragraph({ text: '' }),
            new Paragraph({
              text: 'Original Submitted Code',
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: review.originalCode,
                  font: 'Courier New',
                  size: 18,
                }),
              ],
            }),
            new Paragraph({ text: '' }),
            new Paragraph({
              text: 'Optimized Code (AI Refactored)',
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: review.reviewedCode || review.originalCode,
                  font: 'Courier New',
                  size: 18,
                  color: '047857',
                }),
              ],
            }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const filename = `CodeReview_${review.title.replace(/[^a-z0-9]/gi, '_')}.docx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buffer);
  } catch (error) {
    next(error);
  }
};
