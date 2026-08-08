import QRCode from "qrcode";

export class QrCodeService {
  async generate(data: string): Promise<Buffer> {
    return QRCode.toBuffer(data, {
      type: "png",
      width: 512,
      margin: 2,
      errorCorrectionLevel: "M",
    });
  }
}
