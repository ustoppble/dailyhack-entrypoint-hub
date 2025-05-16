
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { validateUserCredentials } from '@/lib/api/auth';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const authFormSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type AuthFormValues = z.infer<typeof authFormSchema>;

interface AuthFormProps {
  onAuthSuccess: () => void;
}

const AuthForm = ({ onAuthSuccess }: AuthFormProps) => {
  const { setUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleSubmit = async (data: AuthFormValues) => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      console.log('Auth form submitted with email:', data.email);
      
      const authenticatedUser = await validateUserCredentials(data.email, data.password);
      
      if (!authenticatedUser) {
        setErrorMessage('Invalid email or password');
        toast({
          title: "Authentication failed",
          description: "Invalid email or password.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      console.log('User authenticated successfully');
      
      // Make sure we're setting the user correctly in the context
      setUser(authenticatedUser);
      
      toast({
        title: "Login successful!",
        description: "Welcome back to DailyHack.",
      });
      
      onAuthSuccess();
    } catch (error: any) {
      console.error('Authentication error:', error);
      setErrorMessage(error.message || "An unexpected error occurred");
      toast({
        title: "Authentication failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="your.email@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="********" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {errorMessage && (
          <div className="text-sm font-medium text-destructive">{errorMessage}</div>
        )}
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging in...
            </>
          ) : (
            "Log In"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default AuthForm;
