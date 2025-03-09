import prisma from "../utils/prisma";
import supabase from "../utils/supabaseClient";

class UserService {

    static create = async ({ id }) => {

        const userData = await supabase.auth.admin.getUserById(id);

        if (!userData) {
            return null;
        }

        const user = await prisma.user.upsert({
            where: {
                supabaseId: id
            },
            update: {},
            create: {
                phoneNumber: userData.data.user.user_metadata.phoneNumber,
                email: userData.data.user.email,
                supabaseId: userData.data.user.id,
                name: userData.data.user.user_metadata.full_name
            }
        })

        return user;
    }

    static checkNumber = async ({ id }) => {
        const user = await prisma.user.findUnique({
            where: {
                supabaseId: id
            }
        });

        if (user.phoneNumber) {
            return true;
        }

        return false;

    }

    static getUser = async ({ id }) => {
        const user = await prisma.user.findUnique({
            where: {
                supabaseId: id
            }
        });
        return user;
    }

    static updatePhone = async ({ id, phoneNumber }) => {
        const user = await prisma.user.update({
            where: {
                supabaseId: id
            },
            data: {
                phoneNumber
            }
        });

        return user;
    }

}

export default UserService;