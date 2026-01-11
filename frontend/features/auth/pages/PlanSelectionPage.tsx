import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { planApi, Plan } from '@/services/plan.service';
import { userService } from '@/services/user.service';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';
import { Check } from 'lucide-react';
import { ROUTES } from '@/config/routes.constants';

export default function PlanSelectionPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [selecting, setSelecting] = useState<string | null>(null);
    const navigate = useNavigate();
    const { updateUser } = useAuth();

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const data = await planApi.listPlans();
                setPlans(data);
            } catch (error) {
                toast.error('Error', {
                    description: 'Failed to load plans',
                });
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    const handleSelectPlan = async (plan: Plan) => {
        setSelecting(plan.code);
        try {
            await planApi.selectPlan(plan.code);

            // Refresh user profile to get updated organization_id
            const updatedUser = await userService.getProfile();
            updateUser(updatedUser);

            toast.success('Success', {
                description: `You have selected the ${plan.name} plan.`,
            });
            navigate(ROUTES.DASHBOARD);
        } catch (error: any) {
            toast.error('Error', {
                description: error.response?.data?.message || 'Failed to select plan',
            });
        } finally {
            setSelecting(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading plans...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
            <div className="w-full max-w-7xl">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold tracking-tight mb-4">Choose your plan</h1>
                    <p className="text-muted-foreground text-lg">
                        Select the plan that fits your needs to get started.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {plans.map((plan) => (
                        <Card key={plan.code} className="flex flex-col relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
                            {plan.code === 'pro' && (
                                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                                    POPULAR
                                </div>
                            )}
                            <CardHeader>
                                <CardTitle>{plan.name}</CardTitle>
                                <CardDescription>{plan.description || 'Perfect for starting out'}</CardDescription>
                                <div className="mt-4">
                                    <span className="text-3xl font-bold">
                                        {plan.price === 0 ? 'Free' : `$${plan.price}`}
                                    </span>
                                    {plan.price > 0 && <span className="text-muted-foreground">/mo</span>}
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <ul className="space-y-3">
                                    <li className="flex items-center gap-2 text-sm">
                                        <Check className="h-4 w-4 text-green-500" />
                                        <span>{plan.defaults.credits} Credits / mo</span>
                                    </li>
                                    <li className="flex items-center gap-2 text-sm">
                                        <Check className="h-4 w-4 text-green-500" />
                                        <span>{plan.defaults.scan_limit} Scans / batch</span>
                                    </li>
                                    <li className="flex items-center gap-2 text-sm">
                                        <Check className="h-4 w-4 text-green-500" />
                                        <span>{plan.defaults.seats} Seat{plan.defaults.seats > 1 ? 's' : ''}</span>
                                    </li>
                                    {Object.entries(plan.modules).map(([key, enabled]) => (
                                        enabled && (
                                            <li key={key} className="flex items-center gap-2 text-sm">
                                                <Check className="h-4 w-4 text-green-500" />
                                                <span className="capitalize">{key.replace('_', ' ')}</span>
                                            </li>
                                        )
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full"
                                    onClick={() => handleSelectPlan(plan)}
                                    disabled={!!selecting}
                                    variant={plan.code === 'pro' ? 'default' : 'outline'}
                                >
                                    {selecting === plan.code ? 'Setting up...' : 'Select Plan'}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
