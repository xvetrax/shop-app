"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Product } from "@/lib/types/product";
import { getProducts, createProduct, updateProduct, deleteProduct } from "@/lib/db";
import { supabase, SUPABASE_BUCKET } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const AdminProductsPage = () => {
  const { isAdmin } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [productForm, setProductForm] = useState({
    name: "",
    slug: "",
    price: 0,
    description: "",
    images: [] as string[],
    isActive: true,
  });

  const [newImage, setNewImage] = useState<File | null>(null);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      setProductForm({
        ...productForm,
        [name]: (e.target as HTMLInputElement).checked,
      });
      return;
    }

    if (type === "number") {
      setProductForm({
        ...productForm,
        [name]: Number(value),
      });
      return;
    }

    setProductForm({
      ...productForm,
      [name]: value,
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewImage(e.target.files[0]);
    }
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

  const uploadImage = async (imageFile: File): Promise<string> => {
    const ext = imageFile.name.split(".").pop() || "jpg";
    const safeBase =
      imageFile.name
        .replace(/\.[^/.]+$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") || "image";

    const filePath = `products/${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}-${safeBase}.${ext}`;

    const { error } = await supabase.storage.from(SUPABASE_BUCKET).upload(filePath, imageFile, {
      cacheControl: "3600",
      upsert: false,
      contentType: imageFile.type || "image/jpeg",
    });

    if (error) throw error;

    return publicUrlFromPath(filePath);
  };

  const deleteImage = async (imageUrl: string): Promise<void> => {
    const path = pathFromPublicUrl(imageUrl);
    if (!path) return; // jei ne Supabase public url (mūsų bucket), praleidžiam

    const { error } = await supabase.storage.from(SUPABASE_BUCKET).remove([path]);
    if (error) throw error;
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setProductForm({
      name: "",
      slug: "",
      price: 0,
      description: "",
      images: [],
      isActive: true,
    });
    setNewImage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin) {
      setError("Not allowed.");
      return;
    }

    try {
      setError(null);

      let imageUrls = [...productForm.images];

      // jei uploadinam naują paveikslą
      if (newImage) {
        // jei redaguojam ir buvo senas paveikslas — ištrinam jį
        if (editingProduct && editingProduct.images?.length > 0) {
          try {
            await deleteImage(editingProduct.images[0]);
          } catch (deleteErr) {
            // net jei delete nepavyko, nenutraukiam viso flow
            console.warn("Failed to delete old image (continuing).", deleteErr);
          }
        }

        const url = await uploadImage(newImage);
        imageUrls = [url]; // vienas paveikslas per produktą
      }

      if (editingProduct) {
        await updateProduct(editingProduct.id, { ...productForm, images: imageUrls });
      } else {
        await createProduct({ ...productForm, images: imageUrls });
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
    setProductForm({
      name: product.name,
      slug: product.slug,
      price: product.price,
      description: product.description,
      images: product.images || [],
      isActive: product.isActive,
    });
    setNewImage(null);
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
          setProductForm({
            name: "",
            slug: "",
            price: 0,
            description: "",
            images: [],
            isActive: true,
          });
          setNewImage(null);
        }}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
        disabled={!isAdmin}
        title={!isAdmin ? "Only admin can create products" : ""}
      >
        Add New Product
      </button>

      {showForm && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full"
          id="my-modal"
        >
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
                ></textarea>
              </div>

              <div>
                <label htmlFor="image" className="block text-sm font-medium text-gray-700">
                  Image
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
                {editingProduct?.images?.[0] && !newImage && (
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
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
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
                <td className="py-2 px-4 border-b">{product.name}</td>
                <td className="py-2 px-4 border-b">{product.slug}</td>
                <td className="py-2 px-4 border-b">${product.price.toFixed(2)}</td>
                <td className="py-2 px-4 border-b">{product.isActive ? "Yes" : "No"}</td>
                <td className="py-2 px-4 border-b">
                  {product.images && product.images.length > 0 && (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-16 h-16 object-cover"
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

        {products.length === 0 && (
          <p className="text-sm text-gray-500 mt-4">No products yet.</p>
        )}
      </div>
    </div>
  );
};

export default AdminProductsPage;