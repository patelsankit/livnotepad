import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";
import { IconCheck, IconCopy, IconWashDrycleanOff } from "@tabler/icons-react";
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
    });
    return () => unsubscribe();
  }, []);

  const handleTextChange = (e) => {
    const value = e.target.value;
    setText(value);
    saveText(value);
  };

  return (
    <div>
      <h1 className="text-left sm:text-center text-white text-2xl pb-2 font-bold">
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
      {!copied && (
        <div
          onClick={copyToClipboard}
          className="text-gray-500 hover:text-gray-200 absolute text-base right-3 sm:right-5 top-2 sm:top-8 flex items-center gap-1 cursor-pointer"
        >
          Copy Notepad URL
          <IconCopy className=" h-6 w-6 " />
        </div>
      )}
      {copied && (
        <IconCheck className="h-6 w-6 absolute right-3 sm:right-5 top-2 sm:top-8 text-gray-200 cursor-pointer" />
      )}
      <div className="relative">
        <textarea
          value={text}
          onChange={handleTextChange}
          placeholder="Write your notes here..."
          className="small-scroll resize-none shadow-2xl p-4 h-[calc(100dvh-100px)] overflow-auto w-full bg-[#18181b] text-white border-gray-500 border-2 border-solid focus-visible:outline-none rounded-xl"
        />
        <div
          className="absolute right-12 top-3"
          onClick={() => setText("")}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <IconWashDrycleanOff className="h-6 w-6 text-gray-500 hover:text-gray-200 cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Clear</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="absolute right-3 top-3">
          {!textareaCopied && (
            <div
              onClick={copyTextareaToClipboard}
              className="text-gray-500 hover:text-gray-200 flex items-center gap-1 cursor-pointer"
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <IconCopy className="h-6 w-6" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
          {textareaCopied && (
            <IconCheck className="h-6 w-6 text-gray-200 cursor-pointer" />
          )}
        </div>
      </div>
    </div>
  );
};

export default Notepad;
