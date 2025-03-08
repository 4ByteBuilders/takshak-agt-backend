import prisma from "../utils/prisma";
import supabase from "../utils/supabaseClient";

interface User {
    email: string;
    phoneNumber: string;
}

class UserService {;

    static create = async ({email, phoneNumber}) => {

        const userData = await supabase.auth.getUser(email);

        if(!userData) {
            return null;
        }

        const user = await prisma.user.create({
            data: {
                email,
                phoneNumber,
                id : userData.data.user.id,
                name : userData.data.user.user_metadata.full_name
            }
        });

        return user;
    }
}

export default UserService;