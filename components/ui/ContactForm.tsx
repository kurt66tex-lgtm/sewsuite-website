"use client";

import { useActionState } from "react";
import { submitContactForm } from "@/app/contact/actions";

const initialState = { success: false, error: false, message: "" };

export default function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContactForm, initialState);

  if (state.success) {
    return (
      <div className="bg-sew-green/10 border border-sew-green rounded-lg p-8 text-center">
        <svg
          className="w-12 h-12 text-sew-green mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-sew-green font-semibold text-lg">
          Thanks! We'll be in touch within 1 business day.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-sew-slate mb-1.5"
          >
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sew-green focus:border-transparent transition-shadow"
            placeholder="Your full name"
          />
        </div>
        <div>
          <label
            htmlFor="business"
            className="block text-sm font-medium text-sew-slate mb-1.5"
          >
            Business Name{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            id="business"
            name="business"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sew-green focus:border-transparent transition-shadow"
            placeholder="Your business or organization"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-sew-slate mb-1.5"
          >
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sew-green focus:border-transparent transition-shadow"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-sew-slate mb-1.5"
          >
            Phone{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sew-green focus:border-transparent transition-shadow"
            placeholder="(555) 555-5555"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-sew-slate mb-1.5"
        >
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sew-green focus:border-transparent transition-shadow resize-none"
          placeholder="Tell us about your project — what you need, quantities, timeline, etc."
        />
      </div>

      {state.error && (
        <p className="text-red-600 text-sm">
          Something went wrong. Please try emailing us directly.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full sm:w-auto bg-sew-gold hover:bg-sew-gold-light disabled:opacity-60 text-white font-semibold px-8 py-3 rounded-md transition-colors duration-200 text-sm"
      >
        {pending ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
