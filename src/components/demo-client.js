"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DemoClient({ demoSlug, demoTitle, demoUrl, firstStep, user, isContributor }) {
  const router = useRouter();
  const [demoStep, setDemoStep] = useState(firstStep || null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [resolving, setResolving] = useState(null);
  const feedEndRef = useRef(null);

  // Listen for postMessage from the demo iframe
  useEffect(() => {
    function handleMessage(e) {
      if (e.data?.type === "demo-step-change") {
        setDemoStep({
          slug: e.data.slug || null,
          title: e.data.title || null,
        });
      }
      if (e.data?.type === "demo-navigate") {
        if (e.data.slug) {
          router.push(`/demo/${e.data.slug}`);
        } else {
          router.push("/demo");
        }
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [router]);

  async function loadFeedback(step) {
    try {
      let url = `/api/feedback?demo_slug=${encodeURIComponent(demoSlug)}`;
      if (step) url += `&demo_step=${encodeURIComponent(step)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setFeedback(data.feedback || []);
      }
    } catch {
      // silent
    } finally {
      setLoadingFeed(false);
    }
  }

  useEffect(() => {
    if (demoStep) {
      loadFeedback(demoStep.slug);
    }
  }, [demoSlug, demoStep?.slug]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "demo",
          message,
          demo_slug: demoSlug,
          demo_step: demoStep?.slug || null,
          demo_step_title: demoStep?.title || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send");
      }

      setMessage("");
      loadFeedback(demoStep?.slug);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  async function handleReply(feedbackId) {
    if (!replyMessage.trim()) return;
    setSendingReply(true);
    try {
      const res = await fetch("/api/feedback/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback_id: feedbackId, message: replyMessage }),
      });
      if (res.ok) {
        setReplyMessage("");
        setReplyingTo(null);
        loadFeedback(demoStep?.slug);
      }
    } catch {
      // silent
    } finally {
      setSendingReply(false);
    }
  }

  async function handleResolve(id) {
    setResolving(id);
    try {
      const res = await fetch("/api/feedback", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setFeedback((prev) => prev.filter((f) => f.id !== id));
      }
    } catch {
      // silent
    } finally {
      setResolving(null);
    }
  }

  async function handleDeleteReply(replyId) {
    try {
      await fetch("/api/feedback/reply", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: replyId }),
      });
      loadFeedback(demoStep?.slug);
    } catch {
      // silent
    }
  }

  const stepLabel = demoStep?.title ? `Step: ${demoStep.title}` : null;
  const isFeedbackStep = demoStep?.slug === "feedback";

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh" }}>
      {/* Demo iframe */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <iframe
          src={demoUrl}
          style={{ width: "100%", height: "100%", border: "none" }}
          allow="clipboard-read; clipboard-write"
          title={demoTitle}
        />
      </div>

      {/* Feedback panel — hidden on the built-in feedback screen */}
      {isFeedbackStep ? null :
      <div
        style={{
          width: 320,
          flexShrink: 0,
          borderLeft: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
          background: "#fafafa",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Header */}
        <div style={{
          height: 50,
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          fontWeight: 600,
          fontSize: 15,
          boxSizing: "border-box",
        }}>
          Feedback
          <span style={{ fontWeight: 400, fontSize: 13, color: "#999", marginLeft: 8 }}>
            {demoTitle}
          </span>
        </div>

        {/* Feed */}
        <div style={{ flex: 1, overflow: "auto", padding: "12px 16px" }}>
          {loadingFeed ? (
            <p style={{ fontSize: 13, color: "#999", textAlign: "center", padding: 20 }}>
              Loading...
            </p>
          ) : feedback.length === 0 ? (
            <p style={{ fontSize: 13, color: "#999", textAlign: "center", padding: 20 }}>
              No feedback yet. Be the first!
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {feedback.map((item) => {
                const replies = item.feedback_replies || [];
                return (
                  <div
                    key={item.id}
                    style={{
                      background: "#fff",
                      borderRadius: 12,
                      border: "1px solid #e5e7eb",
                      padding: 14,
                    }}
                  >
                    {/* Author + meta */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 26,
                          height: 26,
                          borderRadius: "50%",
                          background: "#f0f0f0",
                          overflow: "hidden",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          {item.members?.avatar_url ? (
                            <img src={item.members.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <span style={{ fontSize: 11, color: "#999" }}>
                              {(item.members?.name || item.email || "?")[0]?.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>
                          {item.members?.name || item.email || "Anonymous"}
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: "#999", flexShrink: 0 }}>
                        {formatDate(item.created_at)}
                      </span>
                    </div>

                    {/* Message */}
                    <p style={{ fontSize: 13, color: "#444", margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                      {item.message}
                    </p>

                    {/* Replies */}
                    {replies.length > 0 && (
                      <div style={{ marginTop: 10, paddingLeft: 14, borderLeft: "2px solid #e5e7eb" }}>
                        {replies.map((reply) => (
                          <div key={reply.id} style={{ marginBottom: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                              <div style={{
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                background: "#f0f0f0",
                                overflow: "hidden",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}>
                                {reply.members?.avatar_url ? (
                                  <img src={reply.members.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                  <span style={{ fontSize: 9, color: "#999" }}>
                                    {(reply.members?.name || "?")[0]?.toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 600 }}>
                                {reply.members?.name || "Member"}
                              </span>
                              <span style={{ fontSize: 10, color: "#999" }}>
                                {formatDate(reply.created_at)}
                              </span>
                              {isContributor && (
                                <button
                                  onClick={() => handleDeleteReply(reply.id)}
                                  style={{
                                    fontSize: 10,
                                    color: "#ef4444",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: 0,
                                  }}
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                            <p style={{ fontSize: 12, color: "#555", margin: 0, whiteSpace: "pre-wrap" }}>
                              {reply.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    {user && (
                      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12 }}>
                        {replyingTo === item.id ? (
                          <div style={{ display: "flex", gap: 6, flex: 1 }}>
                            <input
                              type="text"
                              value={replyMessage}
                              onChange={(e) => setReplyMessage(e.target.value)}
                              placeholder="Write a reply..."
                              style={{
                                flex: 1,
                                borderRadius: 8,
                                border: "1px solid #e0e0e0",
                                background: "#f9f9f9",
                                padding: "6px 10px",
                                fontSize: 12,
                                outline: "none",
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleReply(item.id);
                                }
                              }}
                              autoFocus
                            />
                            <button
                              onClick={() => handleReply(item.id)}
                              disabled={sendingReply || !replyMessage.trim()}
                              style={{
                                borderRadius: 8,
                                background: sendingReply || !replyMessage.trim() ? "#ccc" : "#0066CC",
                                color: "#fff",
                                border: "none",
                                padding: "6px 12px",
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: sendingReply || !replyMessage.trim() ? "default" : "pointer",
                              }}
                            >
                              {sendingReply ? "..." : "Reply"}
                            </button>
                            <button
                              onClick={() => { setReplyingTo(null); setReplyMessage(""); }}
                              style={{ fontSize: 11, color: "#999", background: "none", border: "none", cursor: "pointer" }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => { setReplyingTo(item.id); setReplyMessage(""); }}
                              style={{ fontSize: 12, color: "#0066CC", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                            >
                              Reply
                            </button>
                            {user.email === item.email && (
                              <button
                                onClick={() => handleResolve(item.id)}
                                disabled={resolving === item.id}
                                style={{
                                  fontSize: 12,
                                  color: "#ef4444",
                                  background: "none",
                                  border: "none",
                                  cursor: resolving === item.id ? "default" : "pointer",
                                  padding: 0,
                                  opacity: resolving === item.id ? 0.5 : 1,
                                }}
                              >
                                {resolving === item.id ? "Deleting..." : "Delete"}
                              </button>
                            )}
                            {isContributor && user.email !== item.email && (
                              <button
                                onClick={() => handleResolve(item.id)}
                                disabled={resolving === item.id}
                                style={{
                                  fontSize: 12,
                                  color: "#16a34a",
                                  background: "none",
                                  border: "none",
                                  cursor: resolving === item.id ? "default" : "pointer",
                                  padding: 0,
                                  opacity: resolving === item.id ? 0.5 : 1,
                                }}
                              >
                                {resolving === item.id ? "Resolving..." : "Resolve"}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={feedEndRef} />
            </div>
          )}
        </div>

        {/* Bottom: form for members, join CTA for visitors */}
        <div style={{
          borderTop: "1px solid #e5e7eb",
          padding: "14px 16px",
          background: "#fff",
        }}>
          {user ? (
            <form onSubmit={handleSubmit}>
              {stepLabel && (
                <p style={{ fontSize: 11, color: "#999", margin: "0 0 6px" }}>
                  {stepLabel}
                </p>
              )}
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={2}
                placeholder="What do you think about this?"
                style={{
                  width: "100%",
                  borderRadius: 10,
                  border: "1px solid #e0e0e0",
                  padding: 10,
                  fontSize: 13,
                  resize: "none",
                  outline: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="submit"
                disabled={sending || !message.trim()}
                style={{
                  marginTop: 8,
                  width: "100%",
                  background: sending || !message.trim() ? "#ccc" : "#0066CC",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: sending || !message.trim() ? "default" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {sending ? "Sending..." : "Send feedback"}
              </button>
              {error && (
                <p style={{ fontSize: 12, color: "#d32f2f", marginTop: 6, marginBottom: 0 }}>
                  {error}
                </p>
              )}
            </form>
          ) : (
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "#666", margin: "0 0 10px" }}>
                Join to share your feedback
              </p>
              <a
                href="https://collab.open.coop/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  background: "#0066CC",
                  color: "#fff",
                  borderRadius: 10,
                  padding: "10px",
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                  textAlign: "center",
                }}
              >
                Join The Open Co-op
              </a>
            </div>
          )}
        </div>
      </div>}
    </div>
  );
}
