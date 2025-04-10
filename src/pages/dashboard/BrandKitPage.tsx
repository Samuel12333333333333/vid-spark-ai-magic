
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Upload, Save, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function BrandKitPage() {
  const [primaryColor, setPrimaryColor] = useState("#0ea5e9");
  const [secondaryColor, setSecondaryColor] = useState("#6366f1");
  const [accentColor, setAccentColor] = useState("#8b5cf6");
  const [selectedFont, setSelectedFont] = useState("inter");
  
  const handleSave = () => {
    toast.success("Brand kit saved successfully");
  };
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Brand Kit</h1>
        <p className="text-muted-foreground">
          Manage your brand assets and styling preferences
        </p>
      </div>

      <Tabs defaultValue="colors">
        <TabsList>
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="logos">Logos</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="presets">Saved Presets</TabsTrigger>
        </TabsList>
        
        <TabsContent value="colors" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Brand Colors</CardTitle>
              <CardDescription>
                Set your brand colors to maintain consistency across your videos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex space-x-2">
                    <Input 
                      type="color" 
                      id="primary-color" 
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input 
                      type="text" 
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="flex space-x-2">
                    <Input 
                      type="color" 
                      id="secondary-color" 
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input 
                      type="text" 
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="accent-color">Accent Color</Label>
                  <div className="flex space-x-2">
                    <Input 
                      type="color" 
                      id="accent-color" 
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input 
                      type="text" 
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              
              <div className="border rounded-lg p-6">
                <h3 className="font-medium mb-4">Preview</h3>
                <div className="flex space-x-4">
                  <div 
                    className="w-24 h-24 rounded-lg flex items-center justify-center text-white" 
                    style={{ backgroundColor: primaryColor }}
                  >
                    Primary
                  </div>
                  <div 
                    className="w-24 h-24 rounded-lg flex items-center justify-center text-white" 
                    style={{ backgroundColor: secondaryColor }}
                  >
                    Secondary
                  </div>
                  <div 
                    className="w-24 h-24 rounded-lg flex items-center justify-center text-white" 
                    style={{ backgroundColor: accentColor }}
                  >
                    Accent
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save Colors
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="logos" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Logo Management</CardTitle>
              <CardDescription>
                Upload and manage your brand logos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-6">
                  <h3 className="font-medium mb-4">Primary Logo</h3>
                  <div className="flex justify-center items-center h-40 bg-muted rounded-lg mb-4">
                    <div className="text-center">
                      <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mt-2">
                        Drag and drop or click to upload
                      </p>
                    </div>
                  </div>
                  <Input type="file" className="mb-2" />
                  <p className="text-xs text-muted-foreground">
                    Recommended size: 1000x300px, PNG or SVG with transparency
                  </p>
                </div>
                
                <div className="border rounded-lg p-6">
                  <h3 className="font-medium mb-4">Logo Mark / Icon</h3>
                  <div className="flex justify-center items-center h-40 bg-muted rounded-lg mb-4">
                    <div className="text-center">
                      <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mt-2">
                        Drag and drop or click to upload
                      </p>
                    </div>
                  </div>
                  <Input type="file" className="mb-2" />
                  <p className="text-xs text-muted-foreground">
                    Recommended size: 500x500px, square format with transparency
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save Logos
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="typography" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Typography Settings</CardTitle>
              <CardDescription>
                Choose fonts and text styling for your videos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="heading-font">Heading Font</Label>
                    <Select value={selectedFont} onValueChange={setSelectedFont}>
                      <SelectTrigger id="heading-font">
                        <SelectValue placeholder="Select font" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inter">Inter</SelectItem>
                        <SelectItem value="roboto">Roboto</SelectItem>
                        <SelectItem value="montserrat">Montserrat</SelectItem>
                        <SelectItem value="playfair">Playfair Display</SelectItem>
                        <SelectItem value="opensans">Open Sans</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="body-font">Body Font</Label>
                    <Select defaultValue="opensans">
                      <SelectTrigger id="body-font">
                        <SelectValue placeholder="Select font" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inter">Inter</SelectItem>
                        <SelectItem value="roboto">Roboto</SelectItem>
                        <SelectItem value="montserrat">Montserrat</SelectItem>
                        <SelectItem value="playfair">Playfair Display</SelectItem>
                        <SelectItem value="opensans">Open Sans</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="text-style">Text Style</Label>
                    <Select defaultValue="modern">
                      <SelectTrigger id="text-style">
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="modern">Modern</SelectItem>
                        <SelectItem value="classic">Classic</SelectItem>
                        <SelectItem value="bold">Bold</SelectItem>
                        <SelectItem value="minimalist">Minimalist</SelectItem>
                        <SelectItem value="creative">Creative</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="border rounded-lg p-6">
                  <h3 className="font-medium mb-4">Typography Preview</h3>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Heading</p>
                      <p 
                        className="text-2xl font-bold" 
                        style={{ fontFamily: selectedFont === "inter" ? "Inter, sans-serif" : 
                                selectedFont === "roboto" ? "Roboto, sans-serif" : 
                                selectedFont === "montserrat" ? "Montserrat, sans-serif" : 
                                selectedFont === "playfair" ? "Playfair Display, serif" : 
                                "Open Sans, sans-serif" }}
                      >
                        Your Brand Message Here
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Subheading</p>
                      <p 
                        className="text-lg font-semibold" 
                        style={{ fontFamily: selectedFont === "inter" ? "Inter, sans-serif" : 
                                selectedFont === "roboto" ? "Roboto, sans-serif" : 
                                selectedFont === "montserrat" ? "Montserrat, sans-serif" : 
                                selectedFont === "playfair" ? "Playfair Display, serif" : 
                                "Open Sans, sans-serif" }}
                      >
                        Secondary information shown here
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Body Text</p>
                      <p className="text-sm">
                        This is how your regular text will appear in videos. The font should be 
                        readable at different sizes and work well with your overall brand style.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save Typography
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="presets" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Brand Presets</CardTitle>
              <CardDescription>
                Save and manage complete brand style presets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4 hover:border-smartvid-600 cursor-pointer transition-colors">
                  <h3 className="font-medium mb-2">Primary Brand</h3>
                  <div className="flex space-x-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-smartvid-600"></div>
                    <div className="w-6 h-6 rounded-full bg-smartvid-800"></div>
                    <div className="w-6 h-6 rounded-full bg-smartvid-400"></div>
                  </div>
                  <p className="text-sm text-muted-foreground">Default brand style</p>
                  <div className="flex justify-between mt-4">
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm">Use</Button>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4 hover:border-smartvid-600 cursor-pointer transition-colors">
                  <h3 className="font-medium mb-2">Social Media</h3>
                  <div className="flex space-x-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-smartvid-purple"></div>
                    <div className="w-6 h-6 rounded-full bg-pink-500"></div>
                    <div className="w-6 h-6 rounded-full bg-yellow-400"></div>
                  </div>
                  <p className="text-sm text-muted-foreground">For social campaigns</p>
                  <div className="flex justify-between mt-4">
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm">Use</Button>
                  </div>
                </div>
                
                <div className="border border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center h-[152px]">
                  <PlusCircle className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Create New Preset</p>
                  <p className="text-xs text-muted-foreground">
                    Save current settings as a preset
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
