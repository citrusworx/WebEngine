type MetricCardOpts = {
    icon: string;
    label: string;
    value: string;
    subtitle?: string;
};

export function MetricCard({ icon, label, value, subtitle }: MetricCardOpts) {
    return (
        <div metric>
            <div choice-icon>
                <i icon={icon} lib="solid" iconSize="sm"></i>
            </div>
            <div>
                <p subtle>{label}</p>
                <strong>{value}</strong>
                {subtitle ? <p subtle>{subtitle}</p> : null}
            </div>
        </div>
    );
}
