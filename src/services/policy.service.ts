import prisma from "../utils/prisma";

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
            throw new Error(error);
        }
    }

}

export default PolicyService;
