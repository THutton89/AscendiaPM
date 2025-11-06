import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from '@tanstack/react-query';
import { usersDb } from '../db/users';
import { timeEntriesDb } from '../db/timeEntries';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
const ResourceManagement = () => {
    const { data: users } = useQuery({
        queryKey: ['users'],
        queryFn: usersDb.getAll
    });
    const { data: workloadData } = useQuery({
        queryKey: ['workload'],
        queryFn: async () => {
            if (!users)
                return [];
            const workloads = await Promise.all(users.map(async (user) => {
                const weeklyWorkload = await timeEntriesDb.getUserWorkload(user.id);
                return {
                    ...user,
                    workload: weeklyWorkload
                };
            }));
            return workloads;
        },
        enabled: !!users
    });
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Resource Workload" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: workloadData?.map((user) => (_jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-semibold", children: user.name }), _jsx("p", { className: "text-sm text-gray-500", children: user.email })] }), _jsxs("span", { className: `px-2 py-1 text-sm rounded ${user.availability_hours > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`, children: [user.availability_hours, "h/week"] })] }), _jsx("div", { className: "h-48", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: user.workload, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "date", tickFormatter: (date) => format(new Date(date), 'MMM d') }), _jsx(YAxis, {}), _jsx(Tooltip, { labelFormatter: (date) => format(new Date(date), 'MMM d, yyyy'), formatter: (value) => [`${value}h`, 'Hours'] }), _jsx(Bar, { dataKey: "total_hours", fill: "#4F46E5" })] }) }) }), _jsx("div", { className: "mt-4", children: _jsxs("div", { className: "flex justify-between text-sm text-gray-500", children: [_jsxs("span", { children: ["Weekly Target: ", user.availability_hours, "h"] }), _jsxs("span", { children: ["Utilization: ", Math.round((user.workload?.[0]?.total_hours || 0) / user.availability_hours * 100), "%"] })] }) })] }, user.id))) })] }));
};
export default ResourceManagement;
