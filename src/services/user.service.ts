import prisma from "../utils/prisma";
import supabase from "../utils/supabaseClient";

interface User {
    email: string;
    phoneNumber: string;
}

class UserService {

    static create = async ({ id }) => {

        const userData = await supabase.auth.admin.getUserById(id);

        if (!userData) {
            return null;
        }

        const user = await prisma.user.create({
            data: {
                phoneNumber: userData.data.user.user_metadata.phoneNumber,
                email: userData.data.user.email,
                id: userData.data.user.id,
                name: userData.data.user.user_metadata.full_name
            }
        });

        return user;
    }

    static checkNumber = async ({ id }) => {
        const user = await prisma.user.findUnique({
            where: {
                id
            }
        });

        return (!!user.phoneNumber);
    }

    static updatePhone = async ({ id, phoneNumber }) => {
        const user = await prisma.user.update({
            where: {
                id
            },
            data: {
                phoneNumber
            }
        });

        return user;
    }

    static checkUser = async ({ id }) => {
        const user = await prisma.user.findUnique({
            where: {
                id
            }
        });

        return user;
    }

}

export default UserService;