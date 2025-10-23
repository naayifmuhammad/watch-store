import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, X, Clock, ImageIcon, Video, Mic, Pause, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";

const API_BASE = "http://localhost:4000/api";

const NewRequest = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const voiceRecorder = useVoiceRecorder();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!category || !description) {
      toast.error("Please fill in all required fields");
      return;
    }

    const token = localStorage.getItem("auth_token");
    if (!token) {
      navigate("/auth");
      return;
    }

    setLoading(true);

    try {
      // Include voice recording if exists
      const allFiles = [...files];
      const voiceFile = voiceRecorder.getAudioFile(`voice-note-${Date.now()}.webm`);
      if (voiceFile) {
        allFiles.push(voiceFile);
      }

      // In a real implementation, you would:
      // 1. Upload files to S3 and get keys
      // 2. Send the request with S3 keys
      
      // For now, we'll create a request without media
      const response = await fetch(`${API_BASE}/customer/service-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: [{ category, description }],
          shop_id: 1, // Default shop
          media_s3_keys: [], // Would contain S3 keys in real implementation
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Service request created successfully!");
        navigate("/my-requests");
      } else {
        toast.error(data.error || "Failed to create request");
      }
    } catch (error) {
      toast.error("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />;
    if (file.type.startsWith("video/")) return <Video className="h-4 w-4" />;
    if (file.type.startsWith("audio/")) return <Mic className="h-4 w-4" />;
    return <Upload className="h-4 w-4" />;
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
              <div className="space-y-2">
                <Label htmlFor="category">Watch Type / Category *</Label>
                <Input
                  id="category"
                  placeholder="e.g., Wristwatch, Wall Clock, Table Clock"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>

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
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept="image/*,video/*,audio/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center gap-3"
                  >
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Click to upload files</p>
                      <p className="text-sm text-muted-foreground">
                        Images or videos
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  What Happens Next?
                </h4>
                <ol className="text-sm text-muted-foreground space-y-1 ml-6 list-decimal">
                  <li>Our experts review your request</li>
                  <li>You receive a price quote (typically within 24 hours)</li>
                  <li>Accept the quote to schedule pickup</li>
                  <li>We collect, repair, and deliver your timepiece</li>
                </ol>
              </div>

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
                  disabled={loading || !category || !description}
                  className="flex-1"
                >
                  {loading ? "Submitting..." : "Submit Request"}
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