"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Product } from "@/lib/types/product";
import { getProducts, createProduct, updateProduct, deleteProduct } from "@/lib/db";
import { supabase, SUPABASE_BUCKET } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { ImageCropModal } from "@/components/admin/ImageCropModal";

type ProductFormState = {
  name: string;
  slug: string;
  price: string; // string UI layer
  description: string;
  images: string[];
  isActive: boolean;
};

const AdminProductsPage = () => {
  const { isAdmin } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [productForm, setProductForm] = useState<ProductFormState>({
    name: "",
    slug: "",
    price: "",
    description: "",
    images: [],
    isActive: true,
  });

  // po crop mes įdedam jau paruoštą failą čia
  const [newImage, setNewImage] = useState<File | null>(null);

  // crop UI state
  const [fileToCrop, setFileToCrop] = useState<File | null>(null);

  // preview UI
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // revokinam preview url kai keičiasi / unmount
  useEffect(() => {
    return () => {
      if (croppedPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(croppedPreview);
      }
    };
  }, [croppedPreview]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      setError("Failed to fetch products.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;

    if (type === "checkbox") {
      setProductForm((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    setProductForm((prev) => ({ ...prev, [name]: value }));
  };

  const clearPreview = () => {
    if (croppedPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(croppedPreview);
    }
    setCroppedPreview(null);
  };

  // vietoj tiesiog setNewImage, atidarom crop modalą
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    clearPreview();
    setNewImage(null);
    setFileToCrop(f);

    e.currentTarget.value = ""; // leidžia vėl pasirinkti tą patį failą
  };

  const publicUrlFromPath = (path: string) => {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    return `${base}/storage/v1/object/public/${SUPABASE_BUCKET}/${path}`;
  };

  const pathFromPublicUrl = (url: string) => {
    const marker = `/storage/v1/object/public/${SUPABASE_BUCKET}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return url.substring(idx + marker.length);
  };

  // priima Blob arba File
  const uploadImage = async (imageFile: Blob | File): Promise<string> => {
    const file =
      imageFile instanceof File
        ? imageFile
        : new File([imageFile], `cropped-${Date.now()}.jpg`, {
            type: "image/jpeg",
          });

    const ext = file.name.split(".").pop() || "jpg";
    const safeBase =
      file.name
        .replace(/\.[^/.]+$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") || "image";

    const filePath = `products/${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}-${safeBase}.${ext}`;

    const { error } = await supabase.storage.from(SUPABASE_BUCKET).upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "image/jpeg",
    });

    if (error) throw error;

    return publicUrlFromPath(filePath);
  };

  const deleteImage = async (imageUrl: string): Promise<void> => {
    const path = pathFromPublicUrl(imageUrl);
    if (!path) return;

    const { error } = await supabase.storage.from(SUPABASE_BUCKET).remove([path]);
    if (error) throw error;
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setProductForm({
      name: "",
      slug: "",
      price: "",
      description: "",
      images: [],
      isActive: true,
    });
    setNewImage(null);
    setFileToCrop(null);
    clearPreview();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin) {
      setError("Not allowed.");
      return;
    }

    const priceNumber = Number(productForm.price);
    if (!Number.isFinite(priceNumber) || priceNumber < 0) {
      setError("Invalid price.");
      return;
    }

    try {
      setError(null);

      let imageUrls = [...productForm.images];

      if (newImage) {
        // jei redaguojam ir buvo senas paveikslas — bandom ištrinti jį
        if (editingProduct && editingProduct.images?.length > 0) {
          try {
            await deleteImage(editingProduct.images[0]);
          } catch (deleteErr) {
            console.warn("Failed to delete old image (continuing).", deleteErr);
          }
        }

        const url = await uploadImage(newImage);
        imageUrls = [url];
      }

      const payload = {
        name: productForm.name,
        slug: productForm.slug,
        price: priceNumber,
        description: productForm.description,
        images: imageUrls,
        isActive: productForm.isActive,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
      } else {
        await createProduct(payload as any);
      }

      resetForm();
      await fetchProducts();
    } catch (err) {
      setError("Failed to save product.");
      console.error(err);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    clearPreview();

    setProductForm({
      name: product.name ?? "",
      slug: product.slug ?? "",
      price: product.price !== undefined && product.price !== null ? String(product.price) : "",
      description: product.description ?? "",
      images: product.images || [],
      isActive: !!product.isActive,
    });

    setNewImage(null);
    setFileToCrop(null);
    setShowForm(true);
  };

  const handleDelete = async (productId: string, imageUrls: string[]) => {
    if (!isAdmin) {
      setError("Not allowed.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        setError(null);
        await deleteProduct(productId);

        for (const url of imageUrls || []) {
          try {
            await deleteImage(url);
          } catch (deleteErr) {
            console.warn("Failed to delete image (continuing).", deleteErr);
          }
        }

        await fetchProducts();
      } catch (err) {
        setError("Failed to delete product.");
        console.error(err);
      }
    }
  };

  if (loading) return <p>Loading products...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Admin Products</h1>
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          Back to shop
        </Link>
      </div>

      <button
        onClick={() => {
          setShowForm(true);
          setEditingProduct(null);
          clearPreview();

          setProductForm({
            name: "",
            slug: "",
            price: "",
            description: "",
            images: [],
            isActive: true,
          });

          setNewImage(null);
          setFileToCrop(null);
        }}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
        disabled={!isAdmin}
        title={!isAdmin ? "Only admin can create products" : ""}
      >
        Add New Product
      </button>

      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold mb-4">
              {editingProduct ? "Edit Product" : "Create Product"}
            </h3>

            {!isAdmin && (
              <p className="text-sm text-red-600 mb-3">
                You are not allowed to create/edit products.
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={productForm.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                  disabled={!isAdmin}
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                  Slug
                </label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={productForm.slug}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                  disabled={!isAdmin}
                />
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Price
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={productForm.price}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                  min="0"
                  step="0.01"
                  disabled={!isAdmin}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={productForm.description}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  rows={4}
                  required
                  disabled={!isAdmin}
                />
              </div>

              <div>
                <label htmlFor="image" className="block text-sm font-medium text-gray-700">
                  Image (will crop to 4:3)
                </label>
                <input
                  type="file"
                  id="image"
                  name="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="mt-1 block w-full"
                  disabled={!isAdmin}
                />

                {croppedPreview && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-500 mb-1">New image preview:</p>
                    <img
                      src={croppedPreview}
                      alt="Cropped preview"
                      className="w-full h-48 object-cover rounded-md border"
                    />
                    <p className="text-xs text-gray-500 mt-1">(This is what will be uploaded)</p>
                  </div>
                )}

                {editingProduct?.images?.[0] && !croppedPreview && !newImage && (
                  <p className="text-sm text-gray-500 mt-2">
                    Current image:{" "}
                    <a
                      href={editingProduct.images[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View Image
                    </a>
                  </p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={productForm.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  disabled={!isAdmin}
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Is Active
                </label>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-500 text-white px-4 py-2 rounded"
                  disabled={!isAdmin}
                  title={!isAdmin ? "Only admin can save products" : ""}
                >
                  {editingProduct ? "Update Product" : "Create Product"}
                </button>
              </div>
            </form>
          </div>

          {fileToCrop && (
            <ImageCropModal
              file={fileToCrop}
              aspect={4 / 3}
              onCancel={() => {
                setFileToCrop(null);
                // paliekam seną preview jei buvo – nebūtina clearinti
              }}
              onCropped={({
                blob,
                previewUrl,
              }: {
                blob: Blob;
                previewUrl: string;
              }) => {
                const croppedFile = new File([blob], `product-${Date.now()}.jpg`, {
                  type: "image/jpeg",
                });

                setNewImage(croppedFile);

                // pakeičiam preview (revokinam seną jei reikia)
                if (croppedPreview?.startsWith("blob:")) {
                  URL.revokeObjectURL(croppedPreview);
                }
                setCroppedPreview(previewUrl);

                setFileToCrop(null);
              }}
            />
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              {/* ✅ ID column */}
              <th className="py-2 px-4 border-b text-left">ID</th>
              <th className="py-2 px-4 border-b text-left">Name</th>
              <th className="py-2 px-4 border-b text-left">Slug</th>
              <th className="py-2 px-4 border-b text-left">Price</th>
              <th className="py-2 px-4 border-b text-left">Active</th>
              <th className="py-2 px-4 border-b text-left">Image</th>
              <th className="py-2 px-4 border-b text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                {/* ✅ ID cell + copy */}
                <td className="py-2 px-4 border-b">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">{product.id}</span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(product.id)}
                      className="text-xs text-blue-600 hover:underline"
                      title="Copy ID"
                    >
                      copy
                    </button>
                  </div>
                </td>

                <td className="py-2 px-4 border-b">{product.name}</td>
                <td className="py-2 px-4 border-b">{product.slug}</td>
                <td className="py-2 px-4 border-b">€{Number(product.price).toFixed(2)}</td>
                <td className="py-2 px-4 border-b">{product.isActive ? "Yes" : "No"}</td>
                <td className="py-2 px-4 border-b">
                  {product.images && product.images.length > 0 && (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                </td>
                <td className="py-2 px-4 border-b space-x-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded text-sm"
                    disabled={!isAdmin}
                    title={!isAdmin ? "Only admin can edit" : ""}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id, product.images || [])}
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                    disabled={!isAdmin}
                    title={!isAdmin ? "Only admin can delete" : ""}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {products.length === 0 && <p className="text-sm text-gray-500 mt-4">No products yet.</p>}
      </div>
    </div>
  );
};

export default AdminProductsPage;