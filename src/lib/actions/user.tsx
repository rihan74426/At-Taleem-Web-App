import User from "../models/User";
import { connect } from "../mongodb/mongoose";

export const createAndUpdateUser = async (
  id: string,
  first_name: string,
  last_name: string,
  image_url: string,
  email_addresses: Array<{ email_address: string }>
) => {
  try {
    await connect();

    const user = await User.findOneAndUpdate(
      { clerkId: id },
      {
        $set: {
          firstname: first_name,
          lastname: last_name,
          profilePicture: image_url,
          email: email_addresses?.[0]?.email_address || "", // Safe fallback
        },
      },
      { new: true, upsert: true }
    );

    return user;
  } catch (error) {
    console.error("Error creating or updating user:", error);
    return null; // Return null in case of an error
  }
};

export const deleteUser = async (id: string) => {
  try {
    await connect();
    await User.findOneAndDelete({ clerkId: id });
  } catch (error) {
    console.error("Error deleting user:", error);
  }
};
