import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Select from "../form/Select";
import { useRegisterMutation, useSendOtpMutation, useVerifyOtpMutation, useInitiateRegisterMutation } from "../../features/api/apiSlice";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { addNotification } from "../../features/notifications/notificationsSlice";

const OTP_LENGTH = 6;
const MAX_RESEND = 3;

/* -------- Optional ID Regex -------- */
const GST_REGEX =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const MSME_REGEX = /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/;
const GUMASTA_REGEX = /^[A-Z0-9/-]{6,20}$/;

export default function SignUpForm() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    businessName: "",
    businessType: "",
    email: "",
    mobile: "",
    optionalId: "",
    password: "",
    confirmPassword: "",
  });

  const updateField = (k: string, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* -------- OTP -------- */
  const [emailOtp, setEmailOtp] = useState<string[]>(
    Array(OTP_LENGTH).fill("")
  );
  const [mobileOtp, setMobileOtp] = useState<string[]>(
    Array(OTP_LENGTH).fill("")
  );

  const emailRefs = useRef<(HTMLInputElement | null)[]>([]);
  const mobileRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [sendOtpMutation] = useSendOtpMutation();
  const [register] = useRegisterMutation();
  const [initiateRegister] = useInitiateRegisterMutation();

  const [emailVerified, setEmailVerified] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  const [verifyOtpMutation] = useVerifyOtpMutation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.token);

  const [initiated, setInitiated] = useState(false);

  useEffect(() => {
    if (token) navigate("/dashboard", { replace: true });
  }, [token, navigate]);

  // Separate resend timers & counts for email and mobile
  const [emailResendTimer, setEmailResendTimer] = useState(0);
  const [mobileResendTimer, setMobileResendTimer] = useState(0);
  const emailTimerRef = useRef<number | null>(null);
  const mobileTimerRef = useRef<number | null>(null);
  const [emailResendCount, setEmailResendCount] = useState(0);
  const [mobileResendCount, setMobileResendCount] = useState(0);

  const startResendTimerFor = (type: "email" | "mobile", secs = 60) => {
    if (type === "email") {
      setEmailResendTimer(secs);
      if (emailTimerRef.current) {
        clearInterval(emailTimerRef.current);
        emailTimerRef.current = null;
      }
      emailTimerRef.current = window.setInterval(() => {
        setEmailResendTimer((t) => {
          if (t <= 1) {
            if (emailTimerRef.current) {
              clearInterval(emailTimerRef.current);
              emailTimerRef.current = null;
            }
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      setMobileResendTimer(secs);
      if (mobileTimerRef.current) {
        clearInterval(mobileTimerRef.current);
        mobileTimerRef.current = null;
      }
      mobileTimerRef.current = window.setInterval(() => {
        setMobileResendTimer((t) => {
          if (t <= 1) {
            if (mobileTimerRef.current) {
              clearInterval(mobileTimerRef.current);
              mobileTimerRef.current = null;
            }
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
  };

  useEffect(() => {
    return () => {
      if (emailTimerRef.current) {
        clearInterval(emailTimerRef.current);
        emailTimerRef.current = null;
      }
      if (mobileTimerRef.current) {
        clearInterval(mobileTimerRef.current);
        mobileTimerRef.current = null;
      }
    };
  }, []);

  /* -------- Send OTP -------- */
  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!form.firstName) e.firstName = "Required";
    if (!form.lastName) e.lastName = "Required";
    if (!form.businessName) e.businessName = "Required";
    if (!form.businessType) e.businessType = "Required";
    if (!acceptedTerms) e.terms = "Accept terms";

    // Email & mobile required at initiation
    if (!form.email) e.email = "Required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email";

    if (!form.mobile) e.mobile = "Required";
    else if (!/^[6-9]\d{9}$/.test(form.mobile)) e.mobile = "Enter valid 10-digit mobile starting with 6-9";

    if (form.optionalId) {
      const v = form.optionalId.trim();
      const valid = GST_REGEX.test(v) || MSME_REGEX.test(v) || GUMASTA_REGEX.test(v);
      if (!valid) e.optionalId = "Enter valid Gumasta/MSME/GST number";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSendOtp = async (method: "EMAIL" | "MOBILE" | "BOTH" = "BOTH") => {
    // Per-field validation: email or mobile must be present and valid depending on method
    try {
      if (method === "EMAIL") {
        if (!form.email) throw new Error("Email is required");
        if (!/^\S+@\S+\.\S+$/.test(form.email)) throw new Error("Enter a valid email");
        const res = await sendOtpMutation({ contactMethod: "EMAIL", contactValue: form.email, purpose: "REGISTER" }).unwrap();
        dispatch(addNotification({ variant: "success", title: "OTP Sent", message: res?.message || "OTP sent to email", timeout: 4000 }));
        setEmailOtp(Array(OTP_LENGTH).fill(""));
        setEmailResendCount(c => c + 1);
        startResendTimerFor("email", 60);
        setTimeout(() => emailRefs.current[0]?.focus(), 100);
      } else if (method === "MOBILE") {
        if (!form.mobile) throw new Error("Mobile is required");
        if (!/^[6-9]\d{9}$/.test(form.mobile)) throw new Error("Enter valid 10-digit mobile starting with 6-9");
        const res = await sendOtpMutation({ contactMethod: "MOBILE", contactValue: form.mobile, purpose: "REGISTER" }).unwrap();
        dispatch(addNotification({ variant: "success", title: "OTP Sent", message: res?.message || "OTP sent to mobile", timeout: 4000 }));
        setMobileOtp(Array(OTP_LENGTH).fill(""));
        setMobileResendCount(c => c + 1);
        startResendTimerFor("mobile", 60);
        setTimeout(() => mobileRefs.current[0]?.focus(), 100);
      } else {
        // BOTH: send to whichever is present and valid
        const triggers: any[] = [];
        if (form.email) {
          if (!/^\S+@\S+\.\S+$/.test(form.email)) throw new Error("Enter a valid email");
          triggers.push(sendOtpMutation({ contactMethod: "EMAIL", contactValue: form.email, purpose: "REGISTER" }));
        } else {
          throw new Error("Email is required");
        }
        if (form.mobile) {
          if (!/^[6-9]\d{9}$/.test(form.mobile)) throw new Error("Enter valid 10-digit mobile starting with 6-9");
          triggers.push(sendOtpMutation({ contactMethod: "MOBILE", contactValue: form.mobile, purpose: "REGISTER" }));
        } else {
          throw new Error("Mobile is required");
        }
        const responses = await Promise.all(triggers.map((t: any) => t.unwrap()));
        const mergedMsg = responses.map((r: any) => r?.message).filter(Boolean).join(" & ") || "OTP sent to email and mobile";
        dispatch(addNotification({ variant: "success", title: "OTP Sent", message: mergedMsg, timeout: 4000 }));
        // set individual states
        setEmailOtp(Array(OTP_LENGTH).fill(""));
        setMobileOtp(Array(OTP_LENGTH).fill(""));
        setEmailResendCount(c => c + 1);
        setMobileResendCount(c => c + 1);
        startResendTimerFor("email", 60);
        startResendTimerFor("mobile", 60);
        setTimeout(() => emailRefs.current[0]?.focus(), 100);
      }

      setStep(2);
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || String(err);
      // attach error to relevant field if possible
      if (method === "EMAIL") setErrors({ email: msg });
      else if (method === "MOBILE") setErrors({ mobile: msg });
      else setErrors({ email: msg });
      dispatch(addNotification({ variant: "error", title: "OTP Failed", message: msg, timeout: 6000 }));
    }
  };

  /* -------- OTP Input -------- */
  const handleOtpChange = (
    value: string,
    i: number,
    type: "email" | "mobile"
  ) => {
    if (!/^\d?$/.test(value)) return;
    const arr = type === "email" ? [...emailOtp] : [...mobileOtp];
    arr[i] = value;
    type === "email" ? setEmailOtp(arr) : setMobileOtp(arr);

    const refs = type === "email" ? emailRefs : mobileRefs;
    if (value && i < OTP_LENGTH - 1) refs.current[i + 1]?.focus();
  };

  const handleOtpPaste = (
    e: React.ClipboardEvent<any>,
    type: "email" | "mobile"
  ) => {
    e.preventDefault();
    const digits = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH)
      .split("");

    const filled = [
      ...digits,
      ...Array(OTP_LENGTH - digits.length).fill(""),
    ];

    // Apply filled OTP to state
    if (type === "email") {
      setEmailOtp(filled);
    } else {
      setMobileOtp(filled);
    }

    // Move focus to last filled input
    const lastIndex = Math.min(digits.length - 1, OTP_LENGTH - 1);
    setTimeout(() => {
      const refs = type === "email" ? emailRefs.current : mobileRefs.current;
      refs[lastIndex]?.focus();
    }, 0);
  };

  const verifyEmailOtp = async () => {
    const code = emailOtp.join("");
    if (code.length !== OTP_LENGTH) {
      setErrors({ otp: "Enter 6-digit OTP" });
      return;
    }
    try {
      const res = await verifyOtpMutation({ contactMethod: "EMAIL", contactValue: form.email, purpose: "REGISTER", otp: code }).unwrap();
      setEmailVerified(true);
      // stop email resend timer and reset count
      setEmailResendTimer(0);
      if (emailTimerRef.current) { clearInterval(emailTimerRef.current); emailTimerRef.current = null; }
      setEmailResendCount(0);
      dispatch(addNotification({ variant: "success", title: "Email verified", message: res?.message || "Email OTP verified", timeout: 3000 }));
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || "Invalid OTP";
      setErrors({ otp: msg });
      dispatch(addNotification({ variant: "error", title: "Verification failed", message: msg, timeout: 5000 }));
    }
  };

  const verifyMobileOtp = async () => {
    const code = mobileOtp.join("");
    if (code.length !== OTP_LENGTH) {
      setErrors({ otp: "Enter 6-digit OTP" });
      return;
    }
    try {
      const res = await verifyOtpMutation({ contactMethod: "MOBILE", contactValue: form.mobile, purpose: "REGISTER", otp: code }).unwrap();
      setMobileVerified(true);
      // stop mobile resend timer and reset count
      setMobileResendTimer(0);
      if (mobileTimerRef.current) { clearInterval(mobileTimerRef.current); mobileTimerRef.current = null; }
      setMobileResendCount(0);
      dispatch(addNotification({ variant: "success", title: "Mobile verified", message: res?.message || "Mobile OTP verified", timeout: 3000 }));
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || "Invalid OTP";
      setErrors({ otp: msg });
      dispatch(addNotification({ variant: "error", title: "Verification failed", message: msg, timeout: 5000 }));
    }
  };

  useEffect(() => {
    if (emailVerified && mobileVerified) setStep(3);
  }, [emailVerified, mobileVerified]);

  /* -------- Password -------- */
  const validatePassword = () => {
    const rule = /^(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,20}$/;
    if (!rule.test(form.password))
      return "Password must contain 1 uppercase & 1 special character";
    if (form.password !== form.confirmPassword)
      return "Passwords do not match";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validatePassword();
    if (err) {
      setErrors({ password: err });
      return;
    }

    // Ensure email and mobile are valid before sending register
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) {
      setErrors({ email: "Enter a valid email" });
      return;
    }
    if (!form.mobile || !/^[6-9]\d{9}$/.test(form.mobile)) {
      setErrors({ mobile: "Enter valid 10-digit mobile starting with 6-9" });
      return;
    }

    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      mobile: form.mobile,
      password: form.password,
      businessType: ((): string => {
        const m = (form.businessType || "").toLowerCase();
        if (m.includes("public")) return "PUBLIC";
        if (m.includes("private limited")) return "PRIVATE LIMITED";
        if (m.includes("llp")) return "LLP";
        return m.toUpperCase() || "PROPRIETOR";
      })(),
      businessName: form.businessName,
      registrationNo: form.optionalId ? form.optionalId : null,
    };

    try {
      await register(payload).unwrap();
      // show success toast then go to sign-in
      dispatch(addNotification({ variant: "success", title: "Account created", message: "Account created successfully", timeout: 4000 }));
      navigate("/signin");
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || "Failed to register";
      setErrors({ email: msg });
      dispatch(addNotification({ variant: "error", title: "Registration failed", message: msg, timeout: 6000 }));
    }
  };

  return (
    <div className="flex flex-col h-screen w-full max-w-md mx-auto overflow-y-auto no-scrollbar px-1 pt-12">
      <div className="space-y-4">
        {/* -------- STEP 1 -------- */}
        {step === 1 && (
          <>
            <h1 className="text-center font-semibold text-title-sm">
              Sign Up
            </h1>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name <span style={{ color: "red" }}>*</span></Label>
                <Input
                  placeholder="First Name"
                  onChange={(e) =>
                    updateField("firstName", e.target.value)
                  }
                />
              </div>

              <div>
                <Label>Last Name <span style={{ color: "red" }}>*</span></Label>
                <Input
                  placeholder="Last Name"
                  onChange={(e) =>
                    updateField("lastName", e.target.value)
                  }
                />
              </div>
            </div>

            <div>
              <Label>Business Name <span style={{ color: "red" }}>*</span></Label>
              <Input
                placeholder="Business Name"
                onChange={(e) =>
                  updateField("businessName", e.target.value)
                }
              />
            </div>

            <div>
              <Label>Business Type <span style={{ color: "red" }}>*</span></Label>
              <Select
                placeholder="Select Business Type"
                defaultValue={form.businessType}
                options={[
                  { value: "Proprietor", label: "Proprietor" },
                  { value: "Private limited", label: "Private Limited" },
                  { value: "LLP", label: "LLP" },
                  {
                    value: "Public",
                    label: "Public",
                  },
                ]}
                onChange={(v) =>
                  updateField("businessType", v)
                }
              />
            </div>

            <div>
              <Label>Email <span style={{ color: "red" }}>*</span></Label>
              <Input
                placeholder="Email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
              />
              {errors.email && (
                <p className="text-sm text-error-500">{errors.email}</p>
              )}
            </div>

            <div>
              <Label>Mobile <span style={{ color: "red" }}>*</span></Label>
              <Input
                placeholder="Mobile"
                type="tel"
                value={form.mobile}
                onChange={(e) =>
                  updateField("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))
                }
              />
              {errors.mobile && (
                <p className="text-sm text-error-500">{errors.mobile}</p>
              )}
            </div>

            <div>
              <Label>Gumasta / MSME / GST</Label>
              <Input
                placeholder="Enter Gumasta / MSME / GST number (optional)"
                value={form.optionalId}
                onChange={(e) =>
                  updateField("optionalId", e.target.value)
                }
              />
              {errors.optionalId && (
                <p className="text-sm text-error-500">
                  {errors.optionalId}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={acceptedTerms}
                onChange={setAcceptedTerms}
              />
              <span className="text-sm">
                I agree to the Terms & Conditions <span style={{ color: "red" }}>*</span>
              </span>
            </div>

            <button
              onClick={async () => {
                setErrors({});
                if (!validateStep1()) return;

                // Build payload, exclude registrationNo if empty
                const payload: any = {
                  firstName: form.firstName,
                  lastName: form.lastName,
                  email: form.email,
                  mobile: form.mobile,
                  businessType: ((): string => {
                    const m = (form.businessType || "").toLowerCase();
                    if (m.includes("public")) return "PUBLIC";
                    if (m.includes("privatelimited")) return "PRIVATE LIMITED";
                    if (m.includes("llp")) return "LLP";
                    return m.toUpperCase() || "PROPRIETOR";
                  })(),
                  businessName: form.businessName,
                };
                if (form.optionalId) payload.registrationNo = form.optionalId;

                try {
                  const res = await initiateRegister(payload).unwrap();
                  // on success move to step 2 and start resend timer
                  setInitiated(true);
                  setStep(2);
                  setEmailOtp(Array(OTP_LENGTH).fill(""));
                  setMobileOtp(Array(OTP_LENGTH).fill(""));
                  // mark that OTPs were sent and start per-contact timers
                  setEmailResendCount(1);
                  setMobileResendCount(1);
                  startResendTimerFor("email", 60);
                  startResendTimerFor("mobile", 60);
                  setTimeout(() => emailRefs.current[0]?.focus(), 100);

                  // show success toast
                  dispatch(addNotification({ variant: "success", title: "OTP Sent", message: res?.message || "OTP sent to email and mobile", timeout: 4000 }));
                } catch (err: any) {
                  const msg = err?.data?.message || err?.message || "Failed to initiate registration";
                  setErrors({ email: msg });
                  dispatch(addNotification({ variant: "error", title: "Initiate failed", message: msg, timeout: 6000 }));
                }
              }}
              className="w-full h-9 items-center justify-center rounded-full bg-indigo-600 px-4 text-xs font-medium text-white hover:bg-indigo-500 mb-10"
            >
              Continue
            </button>
          </>
        )}

        {/* -------- STEP 2 -------- */}
        {step === 2 && (
          <div className="space-y-6">

            <h1 className="text-center font-semibold text-title-sm">
              OTP Verification
            </h1>

            <div>
              <Label>
                Email <span style={{ color: "red" }}>*</span>
              </Label>

              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <Input
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) =>
                      updateField("email", e.target.value)
                    }
                  />
                </div>

                {!initiated ? (
                  <button
                    type="button"
                    onClick={() => handleSendOtp("EMAIL")}
                    className="h-9 px-3 rounded-md bg-indigo-600 text-white text-xs whitespace-nowrap"
                  >
                    Send OTP
                  </button>
                ) : null}
              </div>
            </div>


            <Label>Email OTP</Label>
            <div className="flex justify-center gap-2" onPaste={(e) => handleOtpPaste(e, "email")}>
              {emailOtp.map((_, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    emailRefs.current[i] = el;
                  }}
                  value={emailOtp[i]}
                  maxLength={1}
                  disabled={emailVerified}
                  onPaste={(e) => handleOtpPaste(e, "email")}
                  onChange={(e) =>
                    handleOtpChange(e.target.value, i, "email")
                  }
                  className="w-10 h-10 border rounded text-center"
                />
              ))}
            </div>

            {initiated && !emailVerified && (
              <div className="flex items-center justify-center gap-3 text-sm text-gray-600">
                <span>OTP sent to {form.email}</span>
                <button
                  type="button"
                  onClick={async () => {
                    setErrors({});
                    if (emailResendCount >= MAX_RESEND) {
                      setErrors({ email: 'OTP resend limit reached for email' });
                      return;
                    }
                    try {
                      await handleSendOtp("EMAIL");
                      setEmailOtp(Array(OTP_LENGTH).fill(""));
                    } catch (err) {
                      // handled in handleSendOtp
                    }
                  }}
                  disabled={emailResendTimer > 0 || emailResendCount >= MAX_RESEND}
                  className="h-8 px-2 rounded-md bg-indigo-600 text-white text-xs disabled:opacity-50"
                >
                  {emailResendTimer > 0 ? `Resend in ${emailResendTimer}s` : (emailResendCount >= MAX_RESEND ? 'Limit reached' : 'Resend')}
                </button>
              </div>
            )}

            {emailVerified && (
              <p className="text-center text-success-600 text-sm">
                ✅ Email OTP verified
              </p>
            )}

            <button
              onClick={verifyEmailOtp}
              disabled={emailVerified}
              className="w-full h-9 items-center justify-center rounded-full bg-indigo-600 px-4 text-xs font-medium text-white hover:bg-indigo-500 mb-10"
            >
              Verify Email OTP
            </button>


            <div>
              <Label>
                Mobile <span style={{ color: "red" }}>*</span>
              </Label>

              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <Input
                    type="tel"
                    placeholder="Mobile"
                    value={form.mobile}
                    onChange={(e) =>
                      updateField("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    className="max-w-full"
                  />
                </div>

                {!initiated ? (
                  <button
                    type="button"
                    onClick={() => handleSendOtp("MOBILE")}
                    className="h-9 px-3 rounded-md bg-indigo-600 text-white text-xs whitespace-nowrap"
                  >
                    Send OTP
                  </button>
                ) : null}
              </div>
            </div>


            <Label>Mobile OTP</Label>
            <div className="flex justify-center gap-2" onPaste={(e) => handleOtpPaste(e, "mobile")}>
              {mobileOtp.map((_, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    mobileRefs.current[i] = el;
                  }}
                  value={mobileOtp[i]}
                  maxLength={1}
                  disabled={mobileVerified}
                  onPaste={(e) => handleOtpPaste(e, "mobile")}
                  onChange={(e) =>
                    handleOtpChange(e.target.value, i, "mobile")
                  }
                  className="w-10 h-10 border rounded text-center"
                />
              ))}
            </div>


            {initiated && !mobileVerified && (
              <div className="flex items-center justify-center gap-3 text-sm text-gray-600">
                <span>OTP sent to {form.mobile}</span>
                <button
                  type="button"
                  onClick={async () => {
                    setErrors({});
                    if (mobileResendCount >= MAX_RESEND) {
                      setErrors({ mobile: 'OTP resend limit reached for mobile' });
                      return;
                    }
                    try {
                      await handleSendOtp("MOBILE");
                      setMobileOtp(Array(OTP_LENGTH).fill(""));
                    } catch (err) {
                      // handled in handleSendOtp
                    }
                  }}
                  disabled={mobileResendTimer > 0 || mobileResendCount >= MAX_RESEND}
                  className="h-8 px-2 rounded-md bg-indigo-600 text-white text-xs disabled:opacity-50"
                >
                  {mobileResendTimer > 0 ? `Resend in ${mobileResendTimer}s` : (mobileResendCount >= MAX_RESEND ? 'Limit reached' : 'Resend')}
                </button>
              </div>
            )}

            {mobileVerified && (
              <p className="text-center text-success-600 text-sm">
                ✅ Mobile OTP verified
              </p>
            )}

            <button
              onClick={verifyMobileOtp}
              disabled={mobileVerified}
              className="w-full h-9 items-center justify-center rounded-full bg-indigo-600 px-4 text-xs font-medium text-white hover:bg-indigo-500 mb-10"
            >
              Verify Mobile OTP
            </button>


          </div>
        )}

        {/* -------- STEP 3 -------- */}
        {step === 3 && (
          <>
            <h1 className="text-center font-semibold text-title-sm">
              Generate Password
            </h1>
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* Create Password */}
              <Label>Create Password</Label>
              <div className="relative">
                <Input
                  type={showCreatePassword ? "text" : "password"}
                  placeholder="Create Password"
                  onChange={(e) =>
                    updateField("password", e.target.value)
                  }
                />
                <span
                  onClick={() =>
                    setShowCreatePassword((v) => !v)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500"
                >
                  {showCreatePassword ? <EyeIcon /> : <EyeCloseIcon />}
                </span>
              </div>

              {/* Confirm Password */}
              <Label>Confirm Password</Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  onChange={(e) =>
                    updateField("confirmPassword", e.target.value)
                  }
                />
                <span
                  onClick={() =>
                    setShowConfirmPassword((v) => !v)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500"
                >
                  {showConfirmPassword ? <EyeIcon /> : <EyeCloseIcon />}
                </span>
              </div>

              {errors.password && (
                <p className="text-sm text-error-500">
                  {errors.password}
                </p>
              )}

              <button
                type="submit"
                className="w-full h-9 flex items-center justify-center rounded-full bg-indigo-600 px-4 text-xs font-medium text-white hover:bg-indigo-500 mb-10"
              >
                Create Account
              </button>
            </form>

          </>
        )}
      </div>
    </div>
  );
}
