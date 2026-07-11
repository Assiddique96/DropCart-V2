"use client";
import { assets } from "@/assets/assets";
import { useEffect, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import Loading from "@/components/Loading";
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { ROOT_DOMAIN } from "@/lib/subdomain";

export default function CreateStore() {
  const { user } = useUser();
  const { getToken } = useAuth();
  
  // States
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [alreadySubmitted, setAlreadySubmitted] = useState(false); // ✅ Added missing state variable

  const [storeInfo, setStoreInfo] = useState({
    name: "",
    username: "",
    description: "",
    email: "",
    contact: "",
    address: "",
    image: "",
    payoutBankName: "",
    payoutAccountName: "",
    payoutAccountNumber: "",
  });

  const onChangeHandler = (e) => {
    setStoreInfo({ ...storeInfo, [e.target.name]: e.target.value });
  };

  const fetchSellerStatus = async () => {
    const token = await getToken();
    
    // Guard clause: Avoid sending unauthenticated network requests during Clerk's boot-up/refresh tick
    if (!token) return;

    try {
      const { data } = await axios.get("/api/store/create", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (["pending", "approved", "rejected"].includes(data.status)) {
        setAlreadySubmitted(true); // ✅ Updates state appropriately when status exists
        switch (data.status) {
          case "approved":
            setMessage(
              "You already have an approved store. You can still create another store.",
            );
            break;
          case "pending":
            setMessage(
              "You have at least one store under review. New submissions are still allowed.",
            );
            break;
          case "rejected":
            setMessage(
              "A previous submission was rejected. You can submit a new store.",
            );
            break;
          default:
            break;
        }
      } else {
        setAlreadySubmitted(false); // ✅ Now correctly maps to declared state hook
      }
    } catch (error) {
      toast.error(error.response?.data?.error || error.message);
    }

    setLoading(false);
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!user) {
      return toast.error(
        "You need to be logged in to submit your store details.",
      );
    }

    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("name", storeInfo.name);
      formData.append("username", storeInfo.username);
      formData.append("description", storeInfo.description);
      formData.append("email", storeInfo.email);
      formData.append("contact", storeInfo.contact);
      formData.append("address", storeInfo.address);
      formData.append("image", storeInfo.image);

      formData.append("payoutBankName", storeInfo.payoutBankName);
      formData.append("payoutAccountName", storeInfo.payoutAccountName);
      formData.append("payoutAccountNumber", storeInfo.payoutAccountNumber);

      const { data } = await axios.post("/api/store/create", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success(data.message || "Store details submitted successfully!");
      await fetchSellerStatus();
    } catch (error) {
      toast.error(error.response?.data?.error || error.message);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSellerStatus();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-white dark:bg-slate-950">
        <h1 className="sm:text-2xl lg:text-3xl mx-5 font-semibold text-slate-500 dark:text-slate-300 text-center max-w-2xl">
          Please{" "}
          <span className="text-slate-800 dark:text-slate-100">login</span> to
          submit your store details.
        </h1>
      </div>
    );
  }

  return !loading ? (
    <>
      <div className="mx-6 min-h-[70vh] my-16 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-100">
        {message && (
          <div className="max-w-7xl mx-auto mb-6 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-sm text-slate-600 dark:text-slate-200">
            {message}
          </div>
        )}
        <form
          onSubmit={(e) =>
            toast.promise(onSubmitHandler(e), {
              loading: "Submitting data...",
            })
          }
          className="max-w-7xl mx-auto flex flex-col items-start gap-3 text-slate-500 dark:text-slate-200"
        >
          {/* Title */}
          <div>
            <h1 className="text-3xl">
              Add Your{" "}
              <span className="text-slate-800 dark:text-slate-50 font-medium">
                Store
              </span>
            </h1>
            <p className="max-w-lg text-slate-600 dark:text-slate-300">
              To become a seller on Shpinx, submit your store details for
              review. Your store will be activated after admin verification.
            </p>
          </div>

          <label className="mt-10 cursor-pointer">
            <span className="text-slate-600 dark:text-slate-200">
              Store Logo
            </span>
            <Image
              src={
                storeInfo.image
                  ? URL.createObjectURL(storeInfo.image)
                  : assets.upload_area
              }
              className="rounded-lg mt-2 h-16 w-auto"
              alt=""
              width={150}
              height={100}
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setStoreInfo({ ...storeInfo, image: e.target.files[0] })
              }
              hidden
            />
          </label>

          <p className="text-slate-700 dark:text-slate-200">Username</p>
          <input
            name="username"
            onChange={onChangeHandler}
            value={storeInfo.username}
            type="text"
            placeholder="Enter your store username"
            className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-slate-400 dark:outline-slate-500 w-full max-w-lg p-2 rounded"
          />
          {storeInfo.username.trim() && (
            <p className="text-xs text-slate-500 dark:text-slate-400 -mt-4">
              Your storefront will be live at{" "}
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {storeInfo.username.trim().toLowerCase().replace(/[^a-z0-9-]/g, "")}.{ROOT_DOMAIN}
              </span>{" "}
              — choose carefully, this can&apos;t be changed once your store is approved.
            </p>
          )}

          <p className="text-slate-700 dark:text-slate-200">Business Name</p>
          <input
            name="name"
            onChange={onChangeHandler}
            value={storeInfo.name}
            type="text"
            placeholder="Enter your registered business name"
            className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-slate-400 dark:outline-slate-500 w-full max-w-lg p-2 rounded"
          />

          <p className="text-slate-700 dark:text-slate-200">Description</p>
          <textarea
            name="description"
            onChange={onChangeHandler}
            value={storeInfo.description}
            rows={5}
            placeholder="Enter your store description"
            className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-slate-400 dark:outline-slate-500 w-full max-w-lg p-2 rounded resize-none"
          />

          <p className="text-slate-700 dark:text-slate-200">Business Email</p>
          <input
            name="email"
            onChange={onChangeHandler}
            value={storeInfo.email}
            type="email"
            placeholder="Enter your store email"
            className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-slate-400 dark:outline-slate-500 w-full max-w-lg p-2 rounded"
          />

          <p className="text-slate-700 dark:text-slate-200">
            Business Mobile Number
          </p>
          <input
            name="contact"
            onChange={onChangeHandler}
            value={storeInfo.contact}
            type="text"
            placeholder="Enter your store contact number"
            className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-slate-400 dark:outline-slate-500 w-full max-w-lg p-2 rounded"
          />

          <p className="text-slate-700 dark:text-slate-200">
            Business Address
          </p>
          <textarea
            name="address"
            onChange={onChangeHandler}
            value={storeInfo.address}
            rows={5}
            placeholder="Enter your store address"
            className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-slate-400 dark:outline-slate-500 w-full max-w-lg p-2 rounded resize-none"
          />

          <div className="w-full max-w-lg mt-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900">
            <p className="text-slate-700 dark:text-slate-100 font-medium">
              Bank details for payout
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  Bank Name
                </p>
                <input
                  name="payoutBankName"
                  onChange={onChangeHandler}
                  value={storeInfo.payoutBankName}
                  type="text"
                  placeholder="e.g. Access Bank"
                  className="border border-slate-300 dark:border-slate-700 outline-slate-400 dark:outline-slate-500 w-full p-2 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  Account Name
                </p>
                <input
                  name="payoutAccountName"
                  onChange={onChangeHandler}
                  value={storeInfo.payoutAccountName}
                  type="text"
                  placeholder="Account holder name"
                  className="border border-slate-300 dark:border-slate-700 outline-slate-400 dark:outline-slate-500 w-full p-2 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  Account Number
                </p>
                <input
                  name="payoutAccountNumber"
                  onChange={onChangeHandler}
                  value={storeInfo.payoutAccountNumber}
                  type="text"
                  inputMode="numeric"
                  placeholder="10-digit account number"
                  className="border border-slate-300 dark:border-slate-700 outline-slate-400 dark:outline-slate-500 w-full p-2 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          <button className="bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 px-12 py-2 rounded mt-10 mb-40 active:scale-95 hover:bg-slate-900 dark:hover:bg-slate-200 transition">
            Submit
          </button>
        </form>
      </div>
    </>
  ) : (
    <Loading />
  );
}