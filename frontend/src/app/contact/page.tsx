'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import BackNavigation from '@/components/BackNavigation';

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    });

    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate form submission
        setSubmitted(true);
        setTimeout(() => {
            setFormData({ name: '', email: '', subject: '', message: '' });
            setSubmitted(false);
        }, 3000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
            <BackNavigation />

            {/* Hero Section */}
            <div className="bg-white border-b border-slate-100">
                <div className="mx-auto max-w-4xl px-6 lg:px-10 py-12">
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Contact Us</h1>
                    <p className="text-lg text-slate-600">
                        Have questions or feedback? We'd love to hear from you. Get in touch with our support team.
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="mx-auto max-w-4xl px-6 lg:px-10 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Contact Information */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl border border-slate-200 p-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-6">Get in Touch</h2>

                            {/* Email */}
                            <div className="mb-8">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                                        <Mail className="w-5 h-5 text-primary-700" />
                                    </div>
                                    <h3 className="font-semibold text-slate-900">Email</h3>
                                </div>
                                <p className="text-slate-600 text-sm ml-13">support@assetforu.com</p>
                            </div>

                            {/* Phone */}
                            <div className="mb-8">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                                        <Phone className="w-5 h-5 text-primary-700" />
                                    </div>
                                    <h3 className="font-semibold text-slate-900">Phone</h3>
                                </div>
                                <p className="text-slate-600 text-sm ml-13">+91 (44) 2234-5678</p>
                            </div>

                            {/* Location */}
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                                        <MapPin className="w-5 h-5 text-primary-700" />
                                    </div>
                                    <h3 className="font-semibold text-slate-900">Location</h3>
                                </div>
                                <p className="text-slate-600 text-sm ml-13">
                                    <span className="block">AssetForU Technologies</span>
                                    <span className="block">Chennai, Tamil Nadu</span>
                                    <span className="block">India</span>
                                </p>
                            </div>
                        </div>

                        {/* Response Time Note */}
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs text-blue-900">
                                <strong>Response Time:</strong> We aim to respond within 24–48 hours.
                            </p>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl border border-slate-200 p-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-6">Send us a Message</h2>

                            {submitted ? (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                                    <div className="text-4xl mb-3">✓</div>
                                    <h3 className="text-lg font-semibold text-green-900 mb-2">Message Received!</h3>
                                    <p className="text-green-700 text-sm">
                                        Thank you for reaching out. We'll get back to you within 24–48 hours.
                                    </p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {/* Name */}
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-semibold text-slate-900 mb-2">
                                            Name
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="Raj Kumar"
                                            required
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors text-slate-900 placeholder-slate-400"
                                        />
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-semibold text-slate-900 mb-2">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="raj.kumar@example.com"
                                            required
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors text-slate-900 placeholder-slate-400"
                                        />
                                    </div>

                                    {/* Subject */}
                                    <div>
                                        <label htmlFor="subject" className="block text-sm font-semibold text-slate-900 mb-2">
                                            Subject
                                        </label>
                                        <select
                                            id="subject"
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors text-slate-900"
                                        >
                                            <option value="">Select a subject</option>
                                            <option value="account">Account & Login</option>
                                            <option value="credits">Payments & Credits</option>
                                            <option value="campaigns">Campaign Access</option>
                                            <option value="store">Asset Store</option>
                                            <option value="technical">Technical Support</option>
                                            <option value="general">General Inquiry</option>
                                        </select>
                                    </div>

                                    {/* Message */}
                                    <div>
                                        <label htmlFor="message" className="block text-sm font-semibold text-slate-900 mb-2">
                                            Message
                                        </label>
                                        <textarea
                                            id="message"
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            placeholder="Please describe your question or issue in detail..."
                                            rows={6}
                                            required
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors text-slate-900 placeholder-slate-400 resize-none"
                                        />
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        className="w-full px-6 py-3 bg-primary-700 text-white font-semibold rounded-lg hover:bg-primary-800 active:bg-primary-900 transition-colors disabled:opacity-50"
                                    >
                                        Submit Request
                                    </button>

                                    <p className="text-xs text-slate-500 text-center">
                                        By submitting this form, you agree to our Terms & Conditions and Privacy Policy.
                                    </p>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
