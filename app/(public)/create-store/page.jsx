"use client";
import { assets } from "@/assets/assets";
import { useEffect, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import Loading from "@/components/Loading";
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";

export default function CreateStore() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [storeInfo, setStoreInfo] = useState({
    name: "",
    username: "",
    description: "",
    email: "",
    contact: "",
    address: "",
    image: "",

    cacNumber: "",
    verificationDocumentType: "NIN",
    verificationDocumentNumber: "",
    verificationDocumentImage: "",
    facialVerificationImage: "",

    payoutBankName: "",
    payoutAccountName: "",
    payoutAccountNumber: "",
  });

  const onChangeHandler = (e) => {
    setStoreInfo({ ...storeInfo, [e.target.name]: e.target.value });
  };

  const fetchSellerStatus = async () => {
    // Logic to check if the store is already submitted
    const token = await getToken();
    try {
      const { data } = await axios.get("/api/store/create", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (["pending", "approved", "rejected"].includes(data.status)) {
        switch (data.status) {
          case "approved":
            setMessage("You already have an approved store. You can still create another store.");
            break;
          case "pending":
            setMessage("You have at least one store under review. New submissions are still allowed.");
            break;
          case "rejected":
            setMessage("A previous submission was rejected. You can submit a new store.");
            break;

          default:
            break;
        }
      } else {
        setAlreadySubmitted(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || error.message);
    }

    setLoading(false);
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    // Logic to submit the store details
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

      formData.append("cacNumber", storeInfo.cacNumber);
      formData.append("verificationDocumentType", storeInfo.verificationDocumentType);
      formData.append("verificationDocumentNumber", storeInfo.verificationDocumentNumber);
      formData.append("verificationDocumentImage", storeInfo.verificationDocumentImage);
      formData.append("facialVerificationImage", storeInfo.facialVerificationImage);

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
      <div className="min-h-[80vh] flex flex-col items-center justify-items-center-400">
        <h1 className="sm:text-2xl lg:text-3xl mx-5 font-semibold text-slate-500 text-center max-w-2xl">
          {" "}
          Please <span className="text-slate-800">login</span> to submit your
          store details.
        </h1>
      </div>
    );
  }

  return !loading ? (
    <>
        <div className="mx-6 min-h-[70vh] my-16">
          {message && (
            <div className="max-w-7xl mx-auto mb-6 p-3 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-600">
              {message}
            </div>
          )}
          <form
            onSubmit={(e) =>
              toast.promise(onSubmitHandler(e), {
                loading: "Submitting data...",
              })
            }
            className="max-w-7xl mx-auto flex flex-col items-start gap-3 text-slate-500"
          >
            {/* Title */}
            <div>
              <h1 className="text-3xl ">
                Add Your{" "}
                <span className="text-slate-800 font-medium">Store</span>
              </h1>
              <p className="max-w-lg">
                To become a seller on Shpinx, submit your store details for
                review. Your store will be activated after admin verification.
              </p>
            </div>

            <label className="mt-10 cursor-pointer">
              Store Logo
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

            <p>Username</p>
            <input
              name="username"
              onChange={onChangeHandler}
              value={storeInfo.username}
              type="text"
              placeholder="Enter your store username"
              className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded"
            />

            <p>Business Name</p>
            <input
              name="name"
              onChange={onChangeHandler}
              value={storeInfo.name}
              type="text"
              placeholder="Enter your registered business name"
              className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded"
            />

            <p>CAC Registration Number</p>
            <input
              name="cacNumber"
              onChange={onChangeHandler}
              value={storeInfo.cacNumber}
              type="text"
              placeholder="e.g. RC1234567"
              className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded"
            />

            <p>Description</p>
            <textarea
              name="description"
              onChange={onChangeHandler}
              value={storeInfo.description}
              rows={5}
              placeholder="Enter your store description"
              className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded resize-none"
            />

            <p>Business Email</p>
            <input
              name="email"
              onChange={onChangeHandler}
              value={storeInfo.email}
              type="email"
              placeholder="Enter your store email"
              className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded"
            />

            <p>Business Mobile Number</p>
            <input
              name="contact"
              onChange={onChangeHandler}
              value={storeInfo.contact}
              type="text"
              placeholder="Enter your store contact number"
              className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded"
            />

            <p>Business Address</p>
            <textarea
              name="address"
              onChange={onChangeHandler}
              value={storeInfo.address}
              rows={5}
              placeholder="Enter your store address"
              className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded resize-none"
            />

            <div className="w-full max-w-lg mt-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
              <p className="text-slate-700 font-medium">Verification</p>
              <p className="text-xs text-slate-500 mt-1">
                Provide a valid ID document and a selfie for facial verification.
              </p>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-sm">Document Type</p>
                  <select
                    name="verificationDocumentType"
                    onChange={onChangeHandler}
                    value={storeInfo.verificationDocumentType}
                    className="border border-slate-300 outline-slate-400 w-full p-2 rounded bg-white"
                  >
                    <option value="NIN">NIN</option>
                    <option value="PASSPORT">Passport</option>
                  </select>
                </div>

                <div>
                  <p className="text-sm">{storeInfo.verificationDocumentType} Number</p>
                  <input
                    name="verificationDocumentNumber"
                    onChange={onChangeHandler}
                    value={storeInfo.verificationDocumentNumber}
                    type="text"
                    placeholder={`Enter your ${storeInfo.verificationDocumentType} number`}
                    className="border border-slate-300 outline-slate-400 w-full p-2 rounded bg-white"
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="cursor-pointer">
                  <p className="text-sm">Upload {storeInfo.verificationDocumentType} Photo</p>
                  <div className="mt-2 rounded-lg border border-slate-200 bg-white p-3 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-md bg-slate-100 overflow-hidden flex items-center justify-center">
                      {storeInfo.verificationDocumentImage ? (
                        <Image
                          src={URL.createObjectURL(storeInfo.verificationDocumentImage)}
                          alt=""
                          width={48}
                          height={48}
                          className="w-12 h-12 object-cover"
                        />
                      ) : (
                        <span className="text-xs text-slate-400">No file</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">Tap to choose an image</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setStoreInfo({ ...storeInfo, verificationDocumentImage: e.target.files[0] })
                    }
                    hidden
                  />
                </label>

                <label className="cursor-pointer">
                  <p className="text-sm">Facial Verification (Selfie)</p>
                  <div className="mt-2 rounded-lg border border-slate-200 bg-white p-3 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-md bg-slate-100 overflow-hidden flex items-center justify-center">
                      {storeInfo.facialVerificationImage ? (
                        <Image
                          src={URL.createObjectURL(storeInfo.facialVerificationImage)}
                          alt=""
                          width={48}
                          height={48}
                          className="w-12 h-12 object-cover"
                        />
                      ) : (
                        <span className="text-xs text-slate-400">No file</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">Tap to take/upload a selfie</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={(e) =>
                      setStoreInfo({ ...storeInfo, facialVerificationImage: e.target.files[0] })
                    }
                    hidden
                  />
                </label>
              </div>
            </div>

            <div className="w-full max-w-lg mt-4 p-4 border border-slate-200 rounded-lg bg-white">
              <p className="text-slate-700 font-medium">Bank details for payout</p>
              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-sm">Bank Name</p>
                  <input
                    name="payoutBankName"
                    onChange={onChangeHandler}
                    value={storeInfo.payoutBankName}
                    type="text"
                    placeholder="e.g. Access Bank"
                    className="border border-slate-300 outline-slate-400 w-full p-2 rounded"
                  />
                </div>

                <div>
                  <p className="text-sm">Account Name</p>
                  <input
                    name="payoutAccountName"
                    onChange={onChangeHandler}
                    value={storeInfo.payoutAccountName}
                    type="text"
                    placeholder="Account holder name"
                    className="border border-slate-300 outline-slate-400 w-full p-2 rounded"
                  />
                </div>

                <div>
                  <p className="text-sm">Account Number</p>
                  <input
                    name="payoutAccountNumber"
                    onChange={onChangeHandler}
                    value={storeInfo.payoutAccountNumber}
                    type="text"
                    inputMode="numeric"
                    placeholder="10-digit account number"
                    className="border border-slate-300 outline-slate-400 w-full p-2 rounded"
                  />
                </div>
              </div>
            </div>

            <button className="bg-slate-800 text-white px-12 py-2 rounded mt-10 mb-40 active:scale-95 hover:bg-slate-900 transition ">
              Submit
            </button>
          </form>
        </div>
    </>
  ) : (
    <Loading />
  );
}
