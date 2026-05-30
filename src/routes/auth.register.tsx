import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/auth/register")({
  head: () => ({ meta: [{ title: "Create account — Marburg Connect" }] }),
  component: RegisterPage,
});

const NATIONALITIES = [
  "German","Indian","Chinese","Syrian","Turkish","Iranian","Pakistani","Nigerian","Brazilian","Ukrainian","Polish","Italian","Spanish","French","American","British","Russian","Vietnamese","Indonesian","Egyptian","Moroccan","Other",
];

const schema = z.object({
  full_name: z.string().min(2, "Enter your full name").max(100),
  email: z.string().email(),
  password: z.string().min(6, "Min 6 characters"),
  nationality: z.string().min(1, "Select your nationality"),
  accept: z.literal(true, { errorMap: () => ({ message: "You must accept the terms" }) }),
});

function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors } } =
    useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name: values.full_name, nationality: values.nationality },
        emailRedirectTo: window.location.origin + "/dashboard",
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created");
    setDone(true);
  };

  if (done) {
    return (
      <div className="container mx-auto max-w-md px-4 py-16 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 font-display text-2xl font-bold">Check your email</h1>
        <p className="mt-2 text-muted-foreground">
          We've sent a confirmation link. Click it to activate your account, then sign in.
        </p>
        <Button asChild className="mt-6"><Link to="/auth/login">Back to sign in</Link></Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex max-w-md flex-col gap-6 px-4 py-12">
      <Card>
        <CardHeader><CardTitle className="font-display text-2xl">Create your account</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="full_name">Full name *</Label>
              <Input id="full_name" {...register("full_name")} />
              {errors.full_name && <p className="mt-1 text-xs text-destructive">{errors.full_name.message}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div>
              <Label>Nationality *</Label>
              <Select value={watch("nationality")} onValueChange={(v) => setValue("nationality", v, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Select nationality" /></SelectTrigger>
                <SelectContent>
                  {NATIONALITIES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.nationality && <p className="mt-1 text-xs text-destructive">{errors.nationality.message}</p>}
            </div>
            <label className="flex items-start gap-2 text-sm">
              <Checkbox onCheckedChange={(c) => setValue("accept", (c === true) as true, { shouldValidate: true })} />
              <span>I accept the terms of use and privacy policy. *</span>
            </label>
            {errors.accept && <p className="text-xs text-destructive">{errors.accept.message as string}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create account
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/auth/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
