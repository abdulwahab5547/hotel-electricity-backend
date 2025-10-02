import axios from "axios";
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
    if (hotelOwner.invoiceLogo) {
      try {
        const response = await axios.get(hotelOwner.invoiceLogo, { responseType: "arraybuffer" });
        const imgBuffer = Buffer.from(response.data, "binary");
        doc.image(imgBuffer, 50, 40, { width: 100 });
        doc.moveDown(3); // add space after logo
      } catch (e) {
        console.warn("⚠️ Could not load invoice logo:", e.message);
        doc.moveDown(2);
      }
    }

    doc.fontSize(20).text("Invoice", { align: "center" });
    doc.moveDown(2);

    doc.fontSize(12).text(`Guest: ${guest.name}`);
    doc.moveDown(0.5);
    doc.text(`Room: ${guest.room}`);
    doc.moveDown(0.5);
    doc.text(`Email: ${guest.email}`);
    doc.moveDown(0.5);
    doc.text(`Period: ${invoice.startDate} → ${invoice.endDate}`);
    doc.moveDown(0.5);
    doc.text(`Rate: $${invoice.costPerKwh}/kWh`);
    doc.moveDown(2);

    // Table header with fixed X positions
    const tableTop = doc.y;
    const colX = [50, 150, 250, 370, 470]; // adjust spacing between columns

    doc.fontSize(12).text("Date", colX[0], tableTop, { underline: true });
    doc.text("Start", colX[1], tableTop, { underline: true });
    doc.text("End", colX[2], tableTop, { underline: true });
    doc.text("Usage (kWh)", colX[3], tableTop, { underline: true });
    doc.text("Cost ($)", colX[4], tableTop, { underline: true });

    let rowY = tableTop + 20;
    invoice.usageDetails.forEach(d => {
      doc.text(d.date, colX[0], rowY);
      doc.text(d.startTime, colX[1], rowY);
      doc.text(d.endTime, colX[2], rowY);
      doc.text(d.usage.toString(), colX[3], rowY);
      doc.text(`$${d.cost}`, colX[4], rowY);
      rowY += 20; // add vertical spacing between rows
    });

    doc.moveDown(3);
    doc.fontSize(14).text(`Total Usage: ${invoice.totalUsage} kWh`);
    doc.moveDown(1);
    doc.fontSize(16).text(`Total Cost: $${invoice.totalCost.toFixed(2)}`, { underline: true });

    doc.end();
  } catch (err) {
    console.error("❌ Error in generateAndEmailInvoice:", err.message);
  }
};
