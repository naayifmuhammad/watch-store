import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, X, Clock, ImageIcon, Video, Mic, Pause, Play, Trash2, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";

const API_BASE = "http://localhost:4000/api";

const WATCH_CATEGORIES = [
  { value: "watch", label: "Watch" },
  { value: "clock", label: "Clock" },
  { value: "timepiece", label: "Timepiece" },
  { value: "smart_wearable", label: "Smart Wearable" },
  { value: "custom", label: "Custom" },
];

interface UploadedMedia {
  id: number;
  s3_key: string;
  type: "image" | "video" | "voice";
  original_filename: string;
  size_bytes: number;
}

const NewRequest = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  
  // Form fields
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [gpsLat, setGpsLat] = useState<number | null>(null);
  const [gpsLon, setGpsLon] = useState<number | null>(null);
  
  // Files
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([]);
  
  const voiceRecorder = useVoiceRecorder();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      
      // Validate file sizes (max 100MB per file)
      const invalidFiles = newFiles.filter(f => f.size > 100 * 1024 * 1024);
      if (invalidFiles.length > 0) {
        toast.error(`Some files exceed 100MB limit: ${invalidFiles.map(f => f.name).join(", ")}`);
        return;
      }
      
      setFiles([...files, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const getFileType = (file: File): "image" | "video" | "voice" => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    if (file.type.startsWith("audio/")) return "voice";
    return "image"; // fallback
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />;
    if (file.type.startsWith("video/")) return <Video className="h-4 w-4" />;
    if (file.type.startsWith("audio/")) return <Mic className="h-4 w-4" />;
    return <Upload className="h-4 w-4" />;
  };

  const uploadMediaFiles = async (filesToUpload: File[]): Promise<UploadedMedia[]> => {
    const token = localStorage.getItem("auth_token");
    const uploadedMediaList: UploadedMedia[] = [];

    for (const file of filesToUpload) {
      try {
        const fileType = getFileType(file);
        
        // Step 1: Get presigned URL
        const presignResponse = await fetch(`${API_BASE}/media/presign`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            type: fileType,
          }),
        });

        if (!presignResponse.ok) {
          throw new Error(`Failed to get presigned URL for ${file.name}`);
        }

        const { presignedUrl, s3Key } = await presignResponse.json();

        // Step 2: Upload to S3
        const uploadResponse = await fetch(presignedUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload ${file.name} to S3`);
        }

        // Step 3: Register media in database
        const registerResponse = await fetch(`${API_BASE}/media`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            s3_key: s3Key,
            type: fileType,
            original_filename: file.name,
            size_bytes: file.size,
          }),
        });

        if (!registerResponse.ok) {
          throw new Error(`Failed to register ${file.name} in database`);
        }

        const registeredMedia = await registerResponse.json();
        uploadedMediaList.push(registeredMedia.media);
        
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        throw error;
      }
    }

    return uploadedMediaList;
  };

  const handleGetLocation = async () => {
    setGettingLocation(true);
    
    try {
      if (!navigator.geolocation) {
        toast.error("Geolocation is not supported by your browser");
        return;
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      setGpsLat(lat);
      setGpsLon(lon);

      // Reverse geocode to get address
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${API_BASE}/customer/geocode?lat=${lat}&lon=${lon}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.address) {
          setAddress(data.address);
          toast.success("Location detected and address filled!");
        } else {
          toast.warning("Location detected, but couldn't get address. Please enter manually.");
        }
      } else {
        toast.warning("Location detected, but couldn't reverse geocode. Please enter address manually.");
      }
    } catch (error: any) {
      if (error.code === 1) {
        toast.error("Location permission denied. Please enable location access.");
      } else if (error.code === 2) {
        toast.error("Location unavailable. Please check your device settings.");
      } else if (error.code === 3) {
        toast.error("Location request timed out. Please try again.");
      } else {
        toast.error("Failed to get location. Please enter address manually.");
      }
    } finally {
      setGettingLocation(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!category) {
      toast.error("Please select a watch category");
      return;
    }
    
    if (!description) {
      toast.error("Please describe the issue");
      return;
    }

    if (!address) {
      toast.error("Please provide your address");
      return;
    }

    const token = localStorage.getItem("auth_token");
    if (!token) {
      navigate("/auth");
      return;
    }

    setLoading(true);
    setUploadingFiles(true);

    try {
      // Step 1: Upload all media files (including voice note)
      const allFiles = [...files];
      const voiceFile = voiceRecorder.getAudioFile(`voice-note-${Date.now()}.webm`);
      if (voiceFile) {
        allFiles.push(voiceFile);
      }

      let uploadedMediaIds: number[] = [];
      
      if (allFiles.length > 0) {
        toast.info(`Uploading ${allFiles.length} file(s)...`);
        const uploadedMediaList = await uploadMediaFiles(allFiles);
        uploadedMediaIds = uploadedMediaList.map(m => m.id);
        setUploadedMedia(uploadedMediaList);
        toast.success("All files uploaded successfully!");
      }

      setUploadingFiles(false);

      // Step 2: Create service request with uploaded media IDs
      const response = await fetch(`${API_BASE}/service-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: [{ 
            category, 
            description 
          }],
          shop_id: 1, // Default shop
          media_ids: uploadedMediaIds,
          address_manual: address,
          gps_lat: gpsLat,
          gps_lon: gpsLon,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Service request created successfully!");
        navigate("/my-requests");
      } else {
        toast.error(data.error?.message || "Failed to create request");
      }
    } catch (error: any) {
      console.error("Error creating request:", error);
      toast.error(error.message || "Failed to create request. Please try again.");
    } finally {
      setLoading(false);
      setUploadingFiles(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/my-requests" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
              Back
            </Link>
            <div className="flex items-center gap-3">
              <img src={logo} alt="Star Watch House" className="h-10 w-10" />
              <div>
                <h2 className="text-lg font-bold">New Service Request</h2>
                <p className="text-xs text-muted-foreground">Star Watch House</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-3xl">Describe Your Watch Issue</CardTitle>
              <CardDescription className="text-base">
                Provide details about your timepiece and the service needed. Our experts will review and provide a quote.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Category Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="category">Watch Type / Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select watch category" />
                  </SelectTrigger>
                  <SelectContent>
                    {WATCH_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Issue Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Please describe the issue with your timepiece in detail. What symptoms have you noticed? When did it start?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">Pickup Address *</Label>
                <div className="flex gap-2">
                  <Input
                    id="address"
                    placeholder="Enter your complete address for pickup"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGetLocation}
                    disabled={gettingLocation}
                  >
                    {gettingLocation ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MapPin className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {gpsLat && gpsLon && (
                  <p className="text-xs text-muted-foreground">
                    GPS: {gpsLat.toFixed(6)}, {gpsLon.toFixed(6)}
                  </p>
                )}
              </div>

              {/* Media Upload Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Media Attachments (Optional)</Label>
                  <p className="text-sm text-muted-foreground">
                    Upload photos, videos, or record a voice note to help us better understand the issue
                  </p>
                </div>

                {/* Voice Recording Section */}
                <div className="border-2 border-primary/20 rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Mic className="h-5 w-5 text-primary" />
                      <span className="font-medium">Voice Note</span>
                    </div>
                    {voiceRecorder.audioBlob && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={voiceRecorder.clearRecording}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>

                  {!voiceRecorder.isRecording && !voiceRecorder.audioBlob && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={async () => {
                        try {
                          await voiceRecorder.startRecording();
                        } catch (error) {
                          toast.error("Could not access microphone. Please check permissions.");
                        }
                      }}
                      disabled={loading}
                    >
                      <Mic className="h-4 w-4 mr-2" />
                      Record Voice Note
                    </Button>
                  )}

                  {voiceRecorder.isRecording && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                          <span className="text-lg font-mono font-semibold">
                            {voiceRecorder.formatTime(voiceRecorder.recordingTime)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={voiceRecorder.cancelRecording}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                        {voiceRecorder.isPaused ? (
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={voiceRecorder.resumeRecording}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Resume
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={voiceRecorder.pauseRecording}
                          >
                            <Pause className="h-4 w-4 mr-1" />
                            Pause
                          </Button>
                        )}
                        <Button
                          variant="heritage"
                          className="flex-1"
                          onClick={voiceRecorder.stopRecording}
                        >
                          Stop & Save
                        </Button>
                      </div>
                    </div>
                  )}

                  {voiceRecorder.audioBlob && !voiceRecorder.isRecording && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                        <Mic className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Voice note recorded</p>
                          <p className="text-xs text-muted-foreground">
                            {voiceRecorder.formatTime(voiceRecorder.recordingTime)}
                          </p>
                        </div>
                      </div>
                      <audio
                        controls
                        src={voiceRecorder.audioUrl || ""}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>

                {/* Uploaded Files List */}
                {files.length > 0 && (
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getFileIcon(file)}
                          <span className="text-sm truncate max-w-[250px]">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(index)}
                          disabled={loading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* File Upload Area */}
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept="image/*,video/*,audio/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={loading}
                  />
                  <label
                    htmlFor="file-upload"
                    className={`cursor-pointer flex flex-col items-center gap-3 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Click to upload files</p>
                      <p className="text-sm text-muted-foreground">
                        Images, videos, or audio files (max 100MB each)
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* What Happens Next */}
              <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  What Happens Next?
                </h4>
                <ol className="text-sm text-muted-foreground space-y-1 ml-6 list-decimal">
                  <li>Our experts review your request and media</li>
                  <li>You receive a price quote (typically within 24 hours)</li>
                  <li>Accept the quote to schedule pickup</li>
                                    <li>We collect, repair, and deliver your timepiece</li>
                </ol>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => navigate("/my-requests")}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="heritage"
                  onClick={handleSubmit}
                  disabled={loading || !category || !description || !address}
                  className="flex-1"
                >
                  {uploadingFiles ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading Files...
                    </>
                  ) : loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Request...
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default NewRequest;