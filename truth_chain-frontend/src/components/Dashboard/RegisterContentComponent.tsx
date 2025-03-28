import { useState } from "react";
import { Upload, FileText } from "lucide-react";

const RegisterContentComponent = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [file, setFile] = useState<File | null>(null);
  const [contentHash, setContentHash] = useState<string>("");
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [_isRegistered, setIsRegistered] = useState<boolean>(false);
  const [transactionId, setTransactionId] = useState<string>("");
  const [_error, setError] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [contentName, setContentName] = useState<string>("");
  const [contentDescription, setContentDescription] = useState<string>("");

  // Mock function to generate SHA-256 hash
  const generateContentHash = (): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockHash = "0x" + Array(64)
          .fill(0)
          .map(() => Math.floor(Math.random() * 16).toString(16))
          .join("");
        resolve(mockHash);
      }, 1000);
    });
  };

  // Mock function to register content
  const registerContent = async (): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const txId = "0x" + Array(64)
          .fill(0)
          .map(() => Math.floor(Math.random() * 16).toString(16))
          .join("");
        resolve(txId);
      }, 2000);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    await handleFileSelection(selectedFile);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files?.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      await handleFileSelection(droppedFile);
    }
  };

  const handleFileSelection = async (selectedFile: File) => {
    setFile(selectedFile);
    setError("");

    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setFilePreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
    }

    try {
      const hash = await generateContentHash();
      setContentHash(hash);
      setCurrentStep(3);
    } catch (err) {
      setError("Failed to generate content hash. Please try again.");
    }
  };

  const handleRegisterContent = async () => {
    if (!contentHash) {
      setError("Content hash not generated.");
      return;
    }

    if (!contentName.trim()) {
      setError("Please provide a name for your content before registering.");
      return;
    }

    setIsRegistering(true);
    setError("");

    try {
      const txId = await registerContent();
      setTransactionId(txId);
      setIsRegistered(true);
      setCurrentStep(4);
    } catch (err) {
      setError("Transaction failed. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  };

  const getFileIcon = () => {
    if (!file) return <Upload className="w-12 h-12" />;
    if (file.type.startsWith("image/")) {
      return filePreview ? (
        <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded" />
      ) : (
        <FileText className="w-12 h-12" />
      );
    }
    return <FileText className="w-12 h-12" />;
  };

  return (
    <div className="p-6">
      <h2>Register Content on Blockchain</h2>

      {currentStep === 1 && (
        <div
          className={`border-2 ${isDragging ? "border-blue-500 bg-blue-500/10" : "border-gray-700 bg-gray-800/50"
            } border-dashed rounded-lg p-12 text-center cursor-pointer`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <input type="file" id="content-upload" onChange={handleFileChange} className="hidden" />
          <label htmlFor="content-upload">
            <Upload className="w-10 h-10" />
            <p>Click to upload or drag and drop your file</p>
          </label>
        </div>
      )}

      {currentStep === 3 && file && (
        <div>
          <h3>Register Content Details</h3>
          <div className="flex">
            <div>{getFileIcon()}</div>
            <div>
              <p>{file.name}</p>
              <p>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <label>Content Name</label>
          <input type="text" value={contentName} onChange={(e) => setContentName(e.target.value)} />

          <label>Description</label>
          <textarea
            value={contentDescription}
            onChange={(e) => setContentDescription(e.target.value)}
            rows={3}
          />

          <button onClick={handleRegisterContent} disabled={isRegistering}>
            {isRegistering ? "Registering..." : "Register"}
          </button>
        </div>
      )}

      {currentStep === 4 && (
        <div>
          <h3>Content Registered Successfully</h3>
          <p>Transaction ID: {transactionId}</p>
        </div>
      )}
    </div>
  );
};

export default RegisterContentComponent;
