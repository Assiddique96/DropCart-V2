'use client'
import { Star, XIcon, ImageIcon, X } from 'lucide-react';
import React, { useState } from 'react'
import toast from 'react-hot-toast';
import { useAuth } from '@clerk/nextjs';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { addRating } from '@/lib/features/rating/ratingSlice';
import Image from 'next/image';

const MAX_IMAGES = 3

const RatingModal = ({ ratingModal, setRatingModal }) => {
    const { getToken } = useAuth()
    const dispatch = useDispatch()
    const [rating, setRating] = useState(0)
    const [review, setReview] = useState('')
    const [images, setImages] = useState([])
    const [hoveredStar, setHoveredStar] = useState(0)

    const handleImages = (e) => {
        const files = Array.from(e.target.files).slice(0, MAX_IMAGES - images.length)
        setImages(prev => [...prev, ...files])
    }

    const removeImage = (idx) => setImages(prev => prev.filter((_, i) => i !== idx))

    const handleSubmit = async () => {
        if (rating < 1 || rating > 5) return toast.error('Please select a star rating.')
        if (review.trim().length < 5) return toast.error('Please write at least a few words.')

        try {
            const token = await getToken()
            const formData = new FormData()
            formData.append('orderId', ratingModal.orderId)
            formData.append('productId', ratingModal.productId)
            formData.append('rating', rating)
            formData.append('review', review)
            images.forEach(img => formData.append('images', img))

            const { data } = await axios.post('/api/rating', formData, {
                headers: { Authorization: `Bearer ${token}` }
            })
            dispatch(addRating(data.rating))
            toast.success(data.message)
            setRatingModal(null)
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
    }

    const starLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent']

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">Rate Your Purchase</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Your review helps other shoppers</p>
                    </div>
                    <button onClick={() => setRatingModal(null)} className="p-1.5 hover:bg-slate-100 rounded-full transition">
                        <XIcon size={18} className="text-slate-500" />
                    </button>
                </div>

                <div className="p-5 space-y-5">
                    {/* Star rating */}
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            {Array.from({ length: 5 }, (_, i) => (
                                <Star
                                    key={i}
                                    size={32}
                                    className={`cursor-pointer transition-transform hover:scale-110 ${
                                        (hoveredStar || rating) > i ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'
                                    }`}
                                    onClick={() => setRating(i + 1)}
                                    onMouseEnter={() => setHoveredStar(i + 1)}
                                    onMouseLeave={() => setHoveredStar(0)}
                                />
                            ))}
                        </div>
                        <p className="text-sm text-slate-500 h-5">
                            {starLabels[hoveredStar || rating] || 'Select a rating'}
                        </p>
                    </div>

                    {/* Review text */}
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">Your Review *</label>
                        <textarea
                            className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none resize-none focus:border-slate-400 transition"
                            placeholder="What did you like or dislike? How was the quality?"
                            rows={4}
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            maxLength={2000}
                        />
                        <p className="text-xs text-slate-300 text-right mt-0.5">{review.length}/2000</p>
                    </div>

                    {/* Image upload */}
                    <div>
                        <label className="text-xs text-slate-500 mb-2 block">
                            Add Photos <span className="text-slate-300">(optional, up to {MAX_IMAGES})</span>
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {images.map((img, idx) => (
                                <div key={idx} className="relative group">
                                    <Image src={URL.createObjectURL(img)} width={64} height={64}
                                        className="w-16 h-16 object-cover rounded-lg border border-slate-200" alt="" />
                                    <button type="button" onClick={() => removeImage(idx)}
                                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition">
                                        <X size={10} />
                                    </button>
                                </div>
                            ))}
                            {images.length < MAX_IMAGES && (
                                <label className="w-16 h-16 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-slate-400 transition text-slate-300">
                                    <ImageIcon size={18} />
                                    <span className="text-[10px] mt-0.5">Add</span>
                                    <input type="file" accept="image/*" multiple hidden onChange={handleImages} />
                                </label>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 pb-5">
                    <button
                        onClick={() => toast.promise(handleSubmit(), { loading: 'Submitting...', success: 'Review submitted!', error: e => e?.message || 'Failed' })}
                        disabled={rating === 0}
                        className="w-full bg-slate-800 text-white py-3 rounded-xl font-medium hover:bg-slate-900 transition disabled:opacity-40 disabled:cursor-not-allowed">
                        Submit Review
                    </button>
                </div>
            </div>
        </div>
    )
}

export default RatingModal
