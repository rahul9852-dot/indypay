import * as bcrypt from "bcryptjs";

export class BcryptService {
  async hash(value: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);

    return await bcrypt.hash(value, salt);
  }

  async compare(value: string, hashedString: string): Promise<boolean> {
    return await bcrypt.compare(value, hashedString);
  }
}
