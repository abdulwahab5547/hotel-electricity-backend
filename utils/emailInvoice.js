import nodemailer from "nodemailer";
import PDFDocument from "pdfkit";
import { Readable } from "stream";

export const emailInvoice = async (invoice, guest, hotelOwner) => {
  try {
    // --- Calculate total billing ---
    const unitRate = parseFloat(process.env.UNIT_RATE || "10");
    const totalAmount = guest.usage * unitRate;

    // --- Generate PDF ---
    const doc = new PDFDocument();
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
    
      try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 Invoice emailed to ${guest.email}`);
      } catch (err) {
        console.error("❌ Failed to send email:", err.message);
      }
    });
    

    // --- PDF content ---
    doc.fontSize(20).text("Invoice", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Guest Name: ${guest.name}`);
    doc.text(`Room: ${guest.room}`);
    doc.text(`Check-in: ${guest.checkInDate.toDateString()}`);
    doc.text(`Check-out: ${guest.checkOutDate.toDateString()}`);
    doc.text(`Usage: ${guest.usage} units`);
    doc.moveDown();
    doc.fontSize(14).text(`Total Amount: $${totalAmount.toFixed(2)}`, { underline: true });
    doc.end();

  } catch (err) {
    console.error("❌ Error sending invoice email:", err.message);
  }
};
