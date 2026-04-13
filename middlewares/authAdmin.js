import { clerkClient } from "@clerk/nextjs/server";

const authAdmin = async (userId) => {
  try {
    if (!userId) return false;
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return process.env.DropCartS.split(",")
      .map((e) => e.trim())
      .includes(user.emailAddresses[0].emailAddress);
  } catch (error) {
    console.error(error);
    return false;
  }
};

export default authAdmin;
