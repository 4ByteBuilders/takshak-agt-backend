import { CustomError } from "../utils/CustomError";
import prisma from "../utils/prisma";
import { MessageStatus } from "@prisma/client";

class PolicyService {
    static async createMessage(name: string, email: string, message: string, userId: string) {
        try {
            const response = await prisma.message.create({
                data: {
                    name,
                    email,
                    message,
                    userId
                }
            });
            return response;
        } catch (error) {
            throw new CustomError("Failed to create message", 500);
        }
    }

}

export default PolicyService;
