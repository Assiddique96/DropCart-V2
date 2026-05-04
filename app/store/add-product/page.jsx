"use client";
import { assets } from "@/assets/assets";
import { useAuth } from "@clerk/nextjs";
import Image from "next/image";
import { useState, useRef } from "react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { XIcon, PlusIcon, SparklesIcon, UploadIcon, ImageIcon, TypeIcon, ChevronDownIcon } from "lucide-react";
import { getStoreAuthHeaders } from "@/lib/storeAuthHeaders";
import ThemeToggle from "@/components/ThemeToggle"; // <-- Theme toggle import

const categories = [
  "Electronics", "Clothing", "Home & Garden", "Beauty & Health",
  "Toys & Games", "Sports & Outdoors", "Books & Media",
  "Food & Beverage", "Hobbies & Crafts", "Automotive",
  "Baby & Kids", "Pet Supplies", "Office Supplies", "Industrial & Scientific", "Others",
];

const countries = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
  "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia",
  "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica",
  "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt",
  "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon",
  "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel",
  "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos",
  "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi",
  "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova",
  "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands",
  "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau",
  "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia",
  "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia",
  "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan",
  "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania",
  "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda",
  "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
  "Yemen", "Zambia", "Zimbabwe",
];

const manufacturers = {
  Electronics: ["Samsung", "Apple", "Sony", "LG", "Huawei", "Xiaomi", "OnePlus", "Google", "Microsoft", "Dell", "HP", "Lenovo", "Asus", "Acer", "Nokia", "Motorola", "Oppo", "Vivo", "Realme", "Others"],
  Clothing: ["Nike", "Adidas", "Puma", "Levi's", "H&M", "Zara", "Uniqlo", "Gucci", "Louis Vuitton", "Chanel", "Prada", "Versace", "Armani", "Tommy Hilfiger", "Ralph Lauren", "Calvin Klein", "Gap", "Old Navy", "Banana Republic", "Others"],
  "Home & Garden": ["IKEA", "Home Depot", "Lowe's", "Wayfair", "Crate & Barrel", "Williams Sonoma", "Bed Bath & Beyond", "Pottery Barn", "West Elm", "CB2", "Anthropologie", "Restoration Hardware", "Hobby Lobby", "Michaels", "Joann", "Others"],
  "Beauty & Health": ["L'Oréal", "Estée Lauder", "Maybelline", "Revlon", "MAC", "NARS", "Clinique", "The Body Shop", "Bath & Body Works", "Victoria's Secret", "Sephora", "Ulta", "Avon", "Mary Kay", "Neutrogena", "Cetaphil", "Olay", "Nivea", "Dove", "Others"],
  "Toys & Games": ["LEGO", "Mattel", "Hasbro", "Fisher-Price", "Nintendo", "Sony PlayStation", "Microsoft Xbox", "Disney", "Marvel", "DC Comics", "Pokémon", "Barbie", "Hot Wheels", "Transformers", "Others"],
  "Sports & Outdoors": ["Nike", "Adidas", "Puma", "Under Armour", "Reebok", "New Balance", "The North Face", "Patagonia", "Columbia", "REI", "Decathlon", "Dick's Sporting Goods", "Academy Sports", "Bass Pro Shops", "Cabela's", "Others"],
  "Books & Media": ["Penguin Random House", "HarperCollins", "Simon & Schuster", "Hachette", "Macmillan", "Scholastic", "Disney", "Warner Bros", "Universal", "Sony Pictures", "Netflix", "Amazon Prime", "HBO", "Others"],
  "Food & Beverage": ["Nestlé", "PepsiCo", "Coca-Cola", "Unilever", "Procter & Gamble", "Kraft Heinz", "Mondelez", "Mars", "Ferrero", "Lindt", "Starbucks", "McDonald's", "KFC", "Subway", "Domino's", "Others"],
  "Hobbies & Crafts": ["Michaels", "Hobby Lobby", "Joann", "Dick Blick", "Ben Franklin", "LEGO", "Copic", "Prismacolor", "Faber-Castell", "Staedtler", "Pentel", "Sharpie", "Crayola", "Others"],
  Automotive: ["Toyota", "Honda", "Ford", "Chevrolet", "BMW", "Mercedes-Benz", "Audi", "Volkswagen", "Nissan", "Hyundai", "Kia", "Tesla", "General Motors", "Fiat", "Renault", "Peugeot", "Others"],
  "Baby & Kids": ["Pampers", "Huggies", "Johnson & Johnson", "Gerber", "Enfamil", "Similac", "Fisher-Price", "LeapFrog", "VTech", "Disney", "Nickelodeon", "Cartoon Network", "Sesame Street", "Mattel", "Hasbro", "Others"],
  "Pet Supplies": ["Purina", "Pedigree", "Whiskas", "Royal Canin", "Hill's", "Iams", "Eukanuba", "Blue Buffalo", "Science Diet", "Taste of the Wild", "Acana", "Orijen", "Petco", "PetSmart", "Chewy", "Others"],
  "Office Supplies": ["Staples", "Office Depot", "OfficeMax", "Amazon Basics", "HP", "Dell", "Lenovo", "Apple", "Microsoft", "Adobe", "Google", "Canon", "Epson", "Brother", "Sharp", "Others"],
  "Industrial & Scientific": ["3M", "Honeywell", "DuPont", "Dow Chemical", "BASF", "Siemens", "General Electric", "Philips", "Bosch", "Makita", "DeWalt", "Milwaukee", "Ridgid", "Snap-on", "Others"],
  Others: ["Generic", "Unknown", "Various", "Others"],
};

const MAX_IMAGES = 8;

export default function StoreAddProduct() {
  const { getToken } = useAuth();
  const [images, setImages] = useState([]); // array of File objects, max 8
  const [loading, setLoading] = useState(false);
  const [aiUsed, setAiUsed] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const fileInputRef = useRef();

  const [productInfo, setProductInfo] = useState({
    name: "",
    description: "",
    mrp: "",
    price: "",
    category: "",
    sku: "",
    quantity: "",
    scheduledAt: "",
    tags: [],
    origin: "LOCAL",
    madeIn: "",
    manufacturer: "",
    acceptCod: true,
  });

  const [variantGroups, setVariantGroups] = useState([]);
  const [newGroupLabel, setNewGroupLabel] = useState("");
  const [newGroupType, setNewGroupType] = useState("TEXT");
  const [newOptionInputs, setNewOptionInputs] = useState({});

  const onChange = (e) =>
    setProductInfo((p) => ({ ...p, [e.target.name]: e.target.value }));

  const addImages = (files) => {
    const newFiles = Array.from(files).slice(0, MAX_IMAGES - images.length);
    setImages((prev) => [...prev, ...newFiles]);
  };

  const removeImage = (idx) =>
    setImages((prev) => prev.filter((_, i) => i !== idx));

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !productInfo.tags.includes(tag) && productInfo.tags.length < 10) {
      setProductInfo((p) => ({ ...p, tags: [...p.tags, tag] }));
      setTagInput("");
    }
  };

  const removeTag = (tag) =>
    setProductInfo((p) => ({
      ...p,
      tags: p.tags.filter((t) => t !== tag),
    }));

  const addVariantGroup = () => {
    const label = newGroupLabel.trim();
    if (!label)
      return toast.error(
        "Enter a variant group name (e.g. Color, Storage, Model)."
      );
    if (variantGroups.find((g) => g.label.toLowerCase() === label.toLowerCase())) {
      return toast.error(`Group "${label}" already exists.`);
    }
    setVariantGroups((prev) => [
      ...prev,
      { label, type: newGroupType, required: true, options: [] },
    ]);
    setNewGroupLabel("");
    setNewGroupType("TEXT");
  };

  const removeVariantGroup = (idx) => {
    setVariantGroups((prev) => prev.filter((_, i) => i !== idx));
    setNewOptionInputs((prev) => {
      const n = { ...prev };
      delete n[idx];
      return n;
    });
  };

  const addOptionToGroup = (groupIdx) => {
    const input = newOptionInputs[groupIdx] || {};
    const label = (input.label || "").trim();
    if (!label) return toast.error("Option label is required.");
    const group = variantGroups[groupIdx];
    if (
      group.options.find(
        (o) => o.label.toLowerCase() === label.toLowerCase()
      )
    ) {
      return toast.error(`Option "${label}" already in ${group.label}.`);
    }
    const newOption = {
      label,
      image: input.image || null,
      priceModifier: parseFloat(input.priceModifier) || 0,
      quantity: parseInt(input.quantity) || 0,
    };
    setVariantGroups((prev) =>
      prev.map((g, i) =>
        i === groupIdx ? { ...g, options: [...g.options, newOption] } : g
      )
    );
    setNewOptionInputs((prev) => ({
      ...prev,
      [groupIdx]: { label: "", image: "", priceModifier: "", quantity: "" },
    }));
  };

  const removeOptionFromGroup = (groupIdx, optIdx) => {
    setVariantGroups((prev) =>
      prev.map((g, i) =>
        i === groupIdx
          ? { ...g, options: g.options.filter((_, j) => j !== optIdx) }
          : g
      )
    );
  };

  const totalOptionCombinations = variantGroups.reduce(
    (acc, g) => acc * Math.max(1, g.options.length),
    1
  );

  const triggerAI = async (file) => {
    if (aiUsed) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64String = reader.result.split(",")[1];
      const mimeType = file.type;
      try {
        await toast.promise(
          axios.post(
            "/api/store/ai",
            { base64Image: base64String, mimeType },
            {
              headers: await getStoreAuthHeaders(getToken),
            }
          ),
          {
            loading: "Analysing image with AI...",
            success: (res) => {
              const data = res.data;
              if (data.name && data.description) {
                setProductInfo((p) => ({
                  ...p,
                  name: data.name,
                  description: data.description,
                }));
                setAiUsed(true);
                return "AI filled product info 🚀";
              }
              return "AI could not analyse the image";
            },
            error: (err) => err?.response?.data?.error || err.message,
          }
        );
      } catch {}
    };
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (images.length === 0)
      return toast.error("Upload at least one product image.");
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(productInfo).forEach(([k, v]) => {
        if (k === "tags") formData.append("tags", v.join(","));
        else if (k === "acceptCod")
          formData.append("acceptCod", v ? "true" : "false");
        else formData.append(k, v);
      });
      images.forEach((img) => formData.append("images", img));

      const { data } = await axios.post("/api/store/product", formData, {
        headers: await getStoreAuthHeaders(getToken),
      });
      toast.success(data.message);

      if (variantGroups.length > 0 && data.productId) {
        await axios.post(
          "/api/store/product/variants",
          { productId: data.productId, groups: variantGroups },
          { headers: await getStoreAuthHeaders(getToken) }
        );
      }

      setProductInfo({
        name: "",
        description: "",
        mrp: "",
        price: "",
        category: "",
        sku: "",
        quantity: "",
        scheduledAt: "",
        tags: [],
        origin: "LOCAL",
        madeIn: "",
        manufacturer: "",
        acceptCod: true,
      });
      setImages([]);
      setAiUsed(false);
      setVariantGroups([]);
      setNewOptionInputs({});
    } catch (error) {
      toast.error(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="text-slate-500 dark:text-slate-300 mb-28 max-w-2xl"
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl">
          Add New{" "}
          <span className="text-slate-800 dark:text-slate-100 font-medium">
            Product
          </span>
        </h1>
        <ThemeToggle compact />
      </div>

      {/* ...rest of your JSX (images, fields, variants, button) stays the same ... */}
    </form>
  );
}
