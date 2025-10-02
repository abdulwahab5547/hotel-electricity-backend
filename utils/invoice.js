import nodemailer from "nodemailer";
import PDFDocument from "pdfkit";

export const generateAndEmailInvoice = async (invoice, guest, hotelOwner) => {
  try {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", async () => {
      const pdfData = Buffer.concat(buffers);

      const smtpPassword = hotelOwner.useDefaultAppPassword
        ? process.env.EMAIL_PASS
        : hotelOwner.customAppPassword;

      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: smtpPassword,
        },
      });

      const mailOptions = {
        from: `"${hotelOwner.firstName} ${hotelOwner.lastName}" <${process.env.EMAIL_USER}>`,
        to: guest.email,
        subject: `Invoice for your stay at ${hotelOwner.buildingName}`,
        text: `Hello ${guest.name},\n\nPlease find your invoice attached.\n\nThank you for staying with us!`,
        attachments: [
          {
            filename: `Invoice_${guest.name}_${Date.now()}.pdf`,
            content: pdfData,
          },
        ],
      };

      await transporter.sendMail(mailOptions);
      console.log(`📧 Invoice emailed to ${guest.email}`);
    });

    // --- PDF Layout ---
    // Hotel Logo (if available)
    if (hotelOwner.invoiceLogo) {
        try {
          doc.image(hotelOwner.invoiceLogo, 50, 40, { width: 100 });
        } catch (e) {
          console.warn("⚠️ Could not load invoice logo:", e.message);
        }
      }

    doc.fontSize(20).text("Invoice", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Guest: ${guest.name}`);
    doc.text(`Room: ${guest.room}`);
    doc.text(`Email: ${guest.email}`);
    doc.text(`Period: ${invoice.startDate} → ${invoice.endDate}`);
    doc.text(`Rate: $${invoice.costPerKwh}/kWh`);
    doc.moveDown();

    // Table header
    doc.fontSize(12).text("Date       Start      End      Usage(kWh)   Cost($)", { underline: true });
    invoice.usageDetails.forEach(d => {
      doc.text(`${d.date}   ${d.startTime} - ${d.endTime}   ${d.usage}   $${d.cost}`);
    });

    doc.moveDown();
    doc.fontSize(14).text(`Total Usage: ${invoice.totalUsage} kWh`);
    doc.fontSize(16).text(`Total Cost: $${invoice.totalCost.toFixed(2)}`, { underline: true });

    doc.end();
  } catch (err) {
    console.error("❌ Error in generateAndEmailInvoice:", err.message);
  }
};
