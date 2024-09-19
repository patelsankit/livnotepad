import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";
import {
  IconCheck,
  IconClipboard,
  IconCopy,
  IconLoader,
  IconWashDrycleanOff,
} from "@tabler/icons-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./components/ui/tooltip";

const Notepad = () => {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const [textareaCopied, setTextareaCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const copyToClipboard = () => {
    const currentUrl = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(currentUrl)
        .then(() => {
          handleCopySuccess();
        })
        .catch((err) => {
          console.error("Failed to copy using Clipboard API:", err);
        });
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = currentUrl;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        handleCopySuccess();
      } catch (err) {
        console.error("Fallback: Oops, unable to copy", err);
      }
      document.body.removeChild(textArea);
    }
  };

  const copyTextareaToClipboard = () => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        handleTextareaCopySuccess();
      })
      .catch((err) => {
        console.error("Failed to copy using Clipboard API:", err);
      });
  };

  const handleCopySuccess = () => {
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleTextareaCopySuccess = () => {
    setTextareaCopied(true);
    setTimeout(() => {
      setTextareaCopied(false);
    }, 2000);
  };

  const saveText = async (value) => {
    try {
      await setDoc(doc(db, "notepad", "sharedText"), { text: value });
    } catch (error) {
      console.error("Error saving document:", error);
    }
  };

  useEffect(() => {
    const docRef = doc(db, "notepad", "sharedText");
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setText(docSnap.data().text);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleTextChange = (e) => {
    const value = e.target.value;
    setText(value);
    saveText(value);
  };
  const clearText = () => {
    setText("");
    saveText("");
  };
  const pasteFromClipboard = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText(); // Read the text from clipboard
      setText((prevText) => prevText + clipboardText); // Append clipboard text to textarea
      saveText(text + clipboardText); // Save updated text to Firestore
    } catch (err) {
      console.error("Failed to read clipboard contents:", err);
    }
  };

  return (
    <div>
      <h1 className="text-left sm:text-center text-white text-lg sm:text-2xl pb-2 font-bold">
        Live Notepad{" "}
        <small className="text-gray-200 text-xs font-normal">
          by{" "}
          <a
            className="cursor-pointer hover:text-blue-500"
            href="https://in.linkedin.com/in/sankit-parasiya-82970416a"
            target="_blank"
          >
            patelsankit
          </a>{" "}
        </small>
      </h1>
      <div
        onClick={copyToClipboard}
        className="text-gray-500 sm:hover:text-gray-200 absolute text-base left-3 sm:left-5 top-2 sm:top-8 flex items-center gap-1 cursor-pointer"
      >
        Copy Notepad URL
        {!copied && <IconCopy className=" h-5 w-5 " />}
        {copied && <IconCheck className="h-5 w-5  text-gray-200" />}
      </div>
      <div className="relative">
        {loading && (
          <div
            className="absolute top-4 left-4 text-blue-500 animate-spin"
            style={{ animationDuration: "2s" }}
          >
            <IconLoader />
          </div>
        )}
        <textarea
          value={text}
          onChange={handleTextChange}
          placeholder={loading ? "" : "Write your notes here..."}
          className="small-scroll resize-none shadow-2xl p-2.5 sm:p-4 h-[calc(100dvh-100px)] overflow-auto w-full bg-[#18181b] text-white border-gray-500 border-2 border-solid focus-visible:outline-none rounded-xl"
        />
        <div
          className="cursor-pointer grid absolute right-[70px] sm:right-[86px] -top-10 text-gray-500 hover:text-gray-200"
          onClick={pasteFromClipboard}
        >
          <IconClipboard className="h-5 w-5  cursor-pointer" />
          <span className="text-xs">paste</span>
        </div>
        <div
          className="cursor-pointer grid absolute right-10 sm:right-12 -top-10 text-gray-500 hover:text-gray-200"
          onClick={clearText}
        >
          <IconWashDrycleanOff className="h-5 w-5  cursor-pointer" />
          <span className="text-xs">clear</span>
        </div>
        <div className="absolute right-2 sm:right-3 -top-10">
          {!textareaCopied && (
            <div
              onClick={copyTextareaToClipboard}
              className="text-gray-500 hover:text-gray-200 grid cursor-pointer"
            >
              <IconCopy className="h-5 w-5" />
              <span className="text-xs">copy</span>
            </div>
          )}
          {textareaCopied && (
            <div className="grid min-w-[25px]">
              <IconCheck className="h-5 w-5 text-gray-200 cursor-pointer" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notepad;