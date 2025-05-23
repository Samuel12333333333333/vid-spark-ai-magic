
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Add Mailchimp validation script
    const script = document.createElement('script');
    script.src = "//s3.amazonaws.com/downloads.mailchimp.com/js/mc-validate.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      // Initialize Mailchimp
      const mailchimpInit = `
        (function($) {
          window.fnames = new Array();
          window.ftypes = new Array();
          fnames[0]='EMAIL';
          ftypes[0]='email';
          fnames[1]='FNAME';
          ftypes[1]='text';
          fnames[2]='LNAME';
          ftypes[2]='text';
          fnames[3]='ADDRESS';
          ftypes[3]='address';
          fnames[4]='PHONE';
          ftypes[4]='phone';
          fnames[5]='BIRTHDAY';
          ftypes[5]='birthday';
          fnames[6]='COMPANY';
          ftypes[6]='text';
        }(jQuery));
        var $mcj = jQuery.noConflict(true);
      `;
      const initScript = document.createElement('script');
      initScript.textContent = mailchimpInit;
      document.body.appendChild(initScript);
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Simulating form submission to Mailchimp
      // In reality, this would be handled by the Mailchimp form action
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Thank you for subscribing to our newsletter!");
      setEmail("");
      
      // Submit the actual form
      const form = document.getElementById('mc-embedded-subscribe-form') as HTMLFormElement;
      if (form) {
        form.submit();
      }
    } catch (error) {
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <footer className="border-t bg-white dark:bg-gray-950">
      <div className="container px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 md:gap-12">
          <div className="col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <span className="text-2xl font-bold text-smartvid-600">SmartVid</span>
            </Link>
            <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md">
              AI-powered video generation platform that transforms text into stunning videos for creators, marketers, educators, and businesses.
            </p>
            <div className="flex space-x-4">
              <Link to="#" aria-label="Facebook" className="text-gray-500 hover:text-smartvid-600 dark:text-gray-400 dark:hover:text-smartvid-500 transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </Link>
              <Link to="#" aria-label="Twitter" className="text-gray-500 hover:text-smartvid-600 dark:text-gray-400 dark:hover:text-smartvid-500 transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </Link>
              <Link to="#" aria-label="Instagram" className="text-gray-500 hover:text-smartvid-600 dark:text-gray-400 dark:hover:text-smartvid-500 transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </Link>
              <Link to="#" aria-label="LinkedIn" className="text-gray-500 hover:text-smartvid-600 dark:text-gray-400 dark:hover:text-smartvid-500 transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </Link>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-white mb-4">Product</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/features" className="text-gray-500 hover:text-smartvid-600 dark:text-gray-400 dark:hover:text-smartvid-500 transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/#pricing" className="text-gray-500 hover:text-smartvid-600 dark:text-gray-400 dark:hover:text-smartvid-500 transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/templates" className="text-gray-500 hover:text-smartvid-600 dark:text-gray-400 dark:hover:text-smartvid-500 transition-colors">
                  Templates
                </Link>
              </li>
              <li>
                <Link to="/integrations" className="text-gray-500 hover:text-smartvid-600 dark:text-gray-400 dark:hover:text-smartvid-500 transition-colors">
                  Integrations
                </Link>
              </li>
              <li>
                <Link to="/use-cases" className="text-gray-500 hover:text-smartvid-600 dark:text-gray-400 dark:hover:text-smartvid-500 transition-colors">
                  Use Cases
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-white mb-4">Resources</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/blog" className="text-gray-500 hover:text-smartvid-600 dark:text-gray-400 dark:hover:text-smartvid-500 transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/help" className="text-gray-500 hover:text-smartvid-600 dark:text-gray-400 dark:hover:text-smartvid-500 transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/#faq" className="text-gray-500 hover:text-smartvid-600 dark:text-gray-400 dark:hover:text-smartvid-500 transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link to="/community" className="text-gray-500 hover:text-smartvid-600 dark:text-gray-400 dark:hover:text-smartvid-500 transition-colors">
                  Community
                </Link>
              </li>
              <li>
                <Link to="/api-docs" className="text-gray-500 hover:text-smartvid-600 dark:text-gray-400 dark:hover:text-smartvid-500 transition-colors">
                  API Docs
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-white mb-4">Company</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/about" className="text-gray-500 hover:text-smartvid-600 dark:text-gray-400 dark:hover:text-smartvid-500 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-gray-500 hover:text-smartvid-600 dark:text-gray-400 dark:hover:text-smartvid-500 transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-500 hover:text-smartvid-600 dark:text-gray-400 dark:hover:text-smartvid-500 transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-500 hover:text-smartvid-600 dark:text-gray-400 dark:hover:text-smartvid-500 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-500 hover:text-smartvid-600 dark:text-gray-400 dark:hover:text-smartvid-500 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="mb-8 max-w-md mx-auto">
            <form
              action="https://smartvideofy.us5.list-manage.com/subscribe/post?u=a1ad332cee875c675a8b94332&amp;id=c3c1ff047e&amp;f_id=001946edf0"
              method="post"
              id="mc-embedded-subscribe-form"
              name="mc-embedded-subscribe-form"
              className="validate"
              target="_blank"
              onSubmit={handleSubmit}
            >
              <div className="flex flex-col space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Subscribe to our newsletter
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Get the latest news and updates delivered to your inbox.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    name="EMAIL"
                    id="mce-EMAIL"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 min-w-0 px-4 py-2 text-base border rounded-md focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:border-gray-700"
                    placeholder="Enter your email"
                  />
                  <Button 
                    type="submit" 
                    className="bg-primary hover:bg-primary-dark" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Subscribing..." : "Subscribe"}
                  </Button>
                </div>
                {/* Hidden field for bot protection */}
                <div aria-hidden="true" style={{ position: 'absolute', left: '-5000px' }}>
                  <input
                    type="text"
                    name="b_a1ad332cee875c675a8b94332_c3c1ff047e"
                    tabIndex={-1}
                  />
                </div>
              </div>
            </form>
          </div>
          <p className="text-sm text-center text-gray-500 dark:text-gray-400">
            © {currentYear} SmartVid. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
