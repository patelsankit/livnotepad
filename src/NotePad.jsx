import { useState, useEffect } from "react";
import { storage, db } from "../firebase";
import { doc, setDoc, onSnapshot, getDoc } from "firebase/firestore";
import {
  deleteObject,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  getStorage,
} from "firebase/storage";
import {
  IconCheck,
  IconClipboard,
  IconCopy,
  IconFile,
  IconLoader,
  IconTrash,
  IconWashDrycleanOff,
} from "@tabler/icons-react";
import { useLocation, useParams } from "react-router-dom";
import { Button } from "./components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";

const Notepad = () => {
  const { noteId } = useParams();
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const [textareaCopied, setTextareaCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [fileUrl, setFileUrl] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const location = useLocation();
  const clearUI = () => {
    const event = new CustomEvent("clearUI");
    window.dispatchEvent(event);
  };

  useEffect(() => {
    const path = location.pathname.substring(1);
    const docRef = doc(db, "files", path); // Get document for the user

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setUploadedFiles(docSnap.data().files || []); // Load files array
      }
    });

    return () => unsubscribe();
  }, [location]);
  useEffect(() => {
    // Listen for the custom event to clear the UI
    const clearUIHandler = () => {
      setUploadedFiles([]); // Clear uploaded files
      setFile(null); // Clear selected files
      setUploadProgress(0); // Reset upload progress
    };

    window.addEventListener("clearUI", clearUIHandler);

    return () => {
      window.removeEventListener("clearUI", clearUIHandler);
    };
  }, []);

  const handleFileChange = async (event) => {
    const selectedFiles = Array.from(event.target.files); // Handle multiple files
    setFile(selectedFiles);

    const path = location.pathname.substring(1);
    const storage = getStorage();

    for (let selectedFile of selectedFiles) {
      let fileName = selectedFile.name;
      const storageRef = ref(storage, `files/${path}/${fileName}`);
      try {
        await getDownloadURL(storageRef);
        let counter = 1;
        while (true) {
          const newFileName = `${fileName
            .split(".")
            .slice(0, -1)
            .join(".")}_copy(${counter}).${fileName.split(".").pop()}`;
          const newStorageRef = ref(storage, `files/${path}/${newFileName}`);

          try {
            await getDownloadURL(newStorageRef);
            counter++;
          } catch (error) {
            if (error.code === "storage/object-not-found") {
              fileName = newFileName;
              break;
            }
          }
        }
      } catch (error) {
        if (error.code !== "storage/object-not-found") {
          console.error("Error checking file existence:", error);
          continue;
        }
      }
      const uniqueStorageRef = ref(storage, `files/${path}/${fileName}`);
      const uploadTask = uploadBytesResumable(uniqueStorageRef, selectedFile);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress((prev) => ({
            ...prev,
            [fileName]: progress,
          }));
        },
        (error) => {
          console.error("Upload error:", error.message);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            setUploadedFiles((prev) => [
              ...prev,
              { name: fileName, url: downloadURL },
            ]);

            const docRef = doc(db, "files", path);
            getDoc(docRef).then((docSnap) => {
              const currentFiles = docSnap.exists() ? docSnap.data().files : [];
              setDoc(docRef, {
                files: [...currentFiles, { name: fileName, url: downloadURL }],
              });
            });
          });
        }
      );
    }
  };
  const handleFileDelete = async (fileUrl, fileName) => {
    const path = location.pathname.substring(1); // Get user path
    const storageRef = ref(storage, `files/${path}/${fileName}`); // Reference to the file

    try {
      // Try deleting the file from Firebase Storage
      await deleteObject(storageRef);

      // If successful, update Firestore and the UI
      await removeFileFromFirestore(path, fileUrl);
    } catch (error) {
      // Handle file not found (404) error
      if (error.code === "storage/object-not-found") {
        console.log("File does not exist, removing from UI.");
        await removeFileFromFirestore(path, fileUrl); // Remove file from Firestore and UI
      } else {
        console.error("Error deleting file:", error);
      }
    }
  };
  const removeFileFromFirestore = async (path, fileUrl) => {
    const docRef = doc(db, "files", path);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const currentFiles = docSnap.data().files || [];
      const updatedFiles = currentFiles.filter((file) => file.url !== fileUrl);
      await setDoc(docRef, { files: updatedFiles });
      setUploadedFiles(updatedFiles);
    }
  };
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
      await setDoc(doc(db, "notepad", noteId), { text: value });
    } catch (error) {
      console.error("Error saving document:", error);
    }
  };
  useEffect(() => {
    setLoading(true);
    const docRef = doc(db, "notepad", noteId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setText(docSnap.data().text);
      } else {
        setText("");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [noteId]);
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
      const clipboardText = await navigator.clipboard.readText();
      setText((prevText) => prevText + clipboardText);
      saveText(text + clipboardText);
    } catch (err) {
      console.error("Failed to read clipboard contents:", err);
    }
  };
  const isUploading = Object.values(uploadProgress).some(
    (progress) => progress < 100
  );

  return (
    <>
      <div>
        <div className="grid grid-cols-[120px_1fr] sm:grid-cols-3 items-center gap-1">
          <div
            onClick={copyToClipboard}
            className="z-10 text-gray-500 sm:hover:text-gray-200  text-base left-3 sm:left-5 top-12 sm:top-2 lg:top-8 flex items-center gap-1 cursor-pointer text-sm"
          >
            Notepad URL
            {!copied && <IconCopy className=" h-5 w-5 " />}
            {copied && <IconCheck className="h-5 w-5  text-gray-200" />}
          </div>
          <h1 className="text-left sm:text-center text-white text-sm sm:text-2xl pb-2 font-bold sm:whitespace-nowrap">
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
          <div className="flex items-center gap-1 lg:gap-3 sm:justify-end">
            <div>
              <div className="flex items-center relative cursor-pointer ">
                <Input
                  onChange={handleFileChange}
                  type="file"
                  className="!cursor-pointer h-full w-full opacity-0 absolute "
                  name=""
                />
                <Button
                  variant="outline"
                  className="cursor-pointer hover:bg-white/20"
                >
                  {isUploading ? (
                    <>
                      <div class="flex items-center justify-center w-full">
                        <div
                          class="flex space-x-2 animate-pulse"
                          style={{ animationDuration: "0.6s" }}
                        >
                          <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                        </div>
                      </div>
                    </>
                  ) : ("File Upload")}
                </Button>
              </div>
            </div>
            <div
              className="cursor-pointer grid  items-center right-[85px] sm:right-[132px] -top-5 sm:-top-12 justify-center sm:h-[55px] sm:w-[55px] sm:rounded-full sm:p-1 sm:bg-white/10 sm:hover:bg-white/20 shadow-lg text-gray-500 hover:text-gray-200"
              onClick={pasteFromClipboard}
            >
              <IconClipboard className="h-5 w-5 sm:w-6 sm:h-6 cursor-pointer mx-auto" />
              <span className="text-xs sm:text-sm text-center">paste</span>
            </div>
            <div
              className="cursor-pointer grid  right-[46px] sm:right-[72px] -top-5 sm:-top-12  items-center justify-center  sm:h-[55px] sm:w-[55px] sm:rounded-full sm:p-1 sm:bg-white/10 sm:hover:bg-white/20 shadow-lg text-gray-500 hover:text-gray-200"
              onClick={clearText}
            >
              <IconWashDrycleanOff className="h-5 w-5 sm:w-6 sm:h-6 cursor-pointer mx-auto" />
              <span className="text-xs sm:text-sm text-center">clear</span>
            </div>
            <div
              className=" right-2 sm:right-3 -top-5 sm:-top-12 flex items-center justify-center cursor-pointer sm:h-[55px] sm:w-[55px] sm:rounded-full sm:p-1 sm:bg-white/10 sm:hover:bg-white/20 shadow-lg text-gray-500 hover:text-gray-200"
              onClick={copyTextareaToClipboard}
            >
              {!textareaCopied && (
                <div className=" grid cursor-pointer ">
                  <IconCopy className="h-5 w-5 sm:w-6 sm:h-6 mx-auto" />
                  <span className="text-xs sm:text-sm text-center">copy</span>
                </div>
              )}
              {textareaCopied && (
                <div className="grid min-w-[25px]">
                  <IconCheck className="h-5 w-5 sm:w-6 sm:h-6 mx-auto text-gray-200 cursor-pointer" />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="relative pt-4 sm:pt-5">
          {loading && (
            <div
              className="absolute top-6 left-1 text-blue-500 animate-spin"
              style={{ animationDuration: "2s" }}
            >
              <IconLoader />
            </div>
          )}
          <textarea
            value={text}
            onChange={handleTextChange}
            placeholder={loading ? "" : "Write your notes here..."}
            className="small-scroll resize-none shadow-2xl p-2.5 sm:p-4 min-h-[300px] h-[calc(70dvh-100px)] overflow-auto w-full bg-[#18181b] text-white border-gray-500 border-2 border-solid focus-visible:outline-none rounded-xl"
          />
          {uploadedFiles.length > 0 && (
            <h1 className="my-2 font-semibold">Your Uploaded Files</h1>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pb-4">
            {uploadedFiles.map((file) => (
              <div
                key={file.url}
                className="p-4 rounded-lg bg-white/10 flex items-center justify-center max-h-[250px] relative"
              >
                <IconTrash
                  className="absolute top-2 right-2 bg-red-600 p-1 rounded-full hover:bg-red-700 focus:outline-none cursor-pointer"
                  onClick={() => handleFileDelete(file.url, file.name)}
                />
                <a href={file.url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={file.url}
                    alt={file.name}
                    className="rounded-xl w-full"
                  />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Notepad;
