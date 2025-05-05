
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents() {
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Find all headings in the content
    const articleContent = document.querySelector('.blog-content');
    if (!articleContent) return;

    const headingElements = articleContent.querySelectorAll('h2, h3, h4');
    const items: HeadingItem[] = [];

    headingElements.forEach((heading) => {
      // Ensure all headings have IDs
      if (!heading.id) {
        const id = heading.textContent?.toLowerCase()
          .replace(/[^\w\s]/gi, '')
          .replace(/\s+/g, '-') || `heading-${items.length}`;
        heading.id = id;
      }

      items.push({
        id: heading.id,
        text: heading.textContent || '',
        level: parseInt(heading.tagName.substring(1), 10)
      });
    });

    setHeadings(items);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (headings.length === 0) return;

      // Determine which heading is currently in view
      const headingElements = headings.map(heading => 
        document.getElementById(heading.id)
      ).filter(Boolean) as HTMLElement[];

      const scrollPosition = window.scrollY + 200; // Offset for better UX

      for (let i = headingElements.length - 1; i >= 0; i--) {
        const current = headingElements[i];
        if (current && current.offsetTop <= scrollPosition) {
          setActiveId(current.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveId(id);
    }
  };

  if (headings.length === 0) return null;

  return (
    <>
      {/* Mobile sticky TOC toggle */}
      <div className="md:hidden fixed bottom-6 left-6 z-40">
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-full shadow-lg"
          onClick={() => setIsOpen(!isOpen)}
        >
          <List className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile TOC */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="md:hidden fixed bottom-20 left-6 z-40"
          >
            <Card className="p-4 shadow-lg max-h-[60vh] overflow-y-auto w-64">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">In this article</h3>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              <ul className="space-y-1">
                {headings.map((heading) => (
                  <li 
                    key={heading.id}
                    className={cn(
                      "py-1 text-sm cursor-pointer hover:text-primary transition-colors",
                      heading.level === 3 && "pl-4",
                      heading.level === 4 && "pl-8",
                      activeId === heading.id ? "text-primary font-medium" : "text-muted-foreground"
                    )}
                    onClick={() => {
                      scrollToHeading(heading.id);
                      setIsOpen(false);
                    }}
                  >
                    {heading.text}
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop TOC */}
      <div className="hidden md:block sticky top-20 self-start">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold">In this article</h3>
        </div>
        <ul className="space-y-1">
          {headings.map((heading) => (
            <li 
              key={heading.id}
              className={cn(
                "py-1 text-sm cursor-pointer hover:text-primary transition-colors",
                heading.level === 3 && "pl-4",
                heading.level === 4 && "pl-8",
                activeId === heading.id ? "text-primary font-medium" : "text-muted-foreground"
              )}
              onClick={() => scrollToHeading(heading.id)}
            >
              {heading.text}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
