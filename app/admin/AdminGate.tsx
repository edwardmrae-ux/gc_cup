"use client";

import { useFormState } from "react-dom";
import { submitAdminPin } from "./actions";

export function AdminGate() {
  const [state, formAction] = useFormState(submitAdminPin, null);
  return (
    <div className="max-w-sm mx-auto mt-12 p-6 border border-slate-200 rounded-lg bg-white shadow-sm">
      <h2 className="text-lg font-semibold text-slate-800 mb-2">Admin access</h2>
      <p className="text-slate-600 text-sm mb-4">Enter the admin PIN to continue.</p>
      <form action={formAction}>
        <input
          type="password"
          name="pin"
          placeholder="PIN"
          className="w-full px-3 py-2 border border-slate-300 rounded mb-2"
          autoComplete="one-time-code"
        />
        {state?.error && (
          <p className="text-red-600 text-sm mb-2">{state.error}</p>
        )}
        <button
          type="submit"
          className="w-full py-2 bg-slate-800 text-white rounded font-medium hover:bg-slate-700"
        >
          Unlock
        </button>
      </form>
    </div>
  );
}
