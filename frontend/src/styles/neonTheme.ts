export const neonThemeStyles = `
	<style>
		/* Styles personnalisés pour les effets néon */
		.neon-text {
			text-shadow: 
				0 0 5px currentColor,
				0 0 10px currentColor,
				0 0 15px currentColor,
				0 0 20px currentColor;
		}
		
		.neon-border {
			box-shadow: 
				0 0 10px currentColor,
				inset 0 0 10px currentColor;
		}
		
		.particles {
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			pointer-events: none;
			z-index: -1;
		}
		
		.particle {
			position: absolute;
			width: 2px;
			height: 2px;
			background: #00ff41;
			border-radius: 50%;
			animation: float 6s ease-in-out infinite;
		}
		
		@keyframes float {
			0%, 100% { transform: translateY(0px) rotate(0deg); }
			50% { transform: translateY(-20px) rotate(180deg); }
		}
		
		.scan-lines::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: linear-gradient(
				transparent 0%,
				rgba(0, 255, 65, 0.03) 50%,
				transparent 100%
			);
			background-size: 100% 4px;
			animation: scan 0.1s linear infinite;
			pointer-events: none;
		}
		
		@keyframes scan {
			0% { background-position: 0 0; }
			100% { background-position: 0 4px; }
		}
		
		.neon-card {
			background: rgba(17, 24, 39, 0.5);
			backdrop-filter: blur(10px);
			border-radius: 1rem;
			border: 1px solid rgba(34, 197, 94, 0.3);
			box-shadow: 
				0 0 20px rgba(34, 197, 94, 0.1),
				inset 0 0 20px rgba(34, 197, 94, 0.1);
		}
		
		.neon-input {
			background: rgba(17, 24, 39, 0.7);
			border: 1px solid rgba(34, 197, 94, 0.5);
			border-radius: 0.5rem;
			color: white;
			padding: 0.75rem 1rem;
			width: 100%;
			transition: all 0.3s ease;
		}
		
		.neon-input:focus {
			outline: none;
			border-color: #22c55e;
			box-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
		}
		
		.neon-input::placeholder {
			color: rgba(156, 163, 175, 0.7);
		}
		
		.neon-btn {
			background: linear-gradient(45deg, rgba(34, 197, 94, 0.2), rgba(59, 130, 246, 0.2));
			border: 1px solid rgba(34, 197, 94, 0.5);
			border-radius: 0.75rem;
			color: white;
			font-weight: bold;
			padding: 0.75rem 1.5rem;
			transition: all 0.3s ease;
			transform: scale(1);
			cursor: pointer;
		}
		
		.neon-btn:hover {
			background: linear-gradient(45deg, rgba(34, 197, 94, 0.4), rgba(59, 130, 246, 0.4));
			transform: scale(1.05);
			box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
		}
		
		.neon-btn-primary {
			background: linear-gradient(45deg, rgba(34, 197, 94, 0.3), rgba(16, 185, 129, 0.3));
			border: 1px solid rgba(34, 197, 94, 0.6);
		}
		
		.neon-btn-primary:hover {
			background: linear-gradient(45deg, rgba(34, 197, 94, 0.5), rgba(16, 185, 129, 0.5));
			box-shadow: 0 0 25px rgba(34, 197, 94, 0.4);
		}
		
		.neon-btn-secondary {
			background: linear-gradient(45deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2));
			border: 1px solid rgba(168, 85, 247, 0.5);
		}
		
		.neon-btn-secondary:hover {
			background: linear-gradient(45deg, rgba(168, 85, 247, 0.4), rgba(236, 72, 153, 0.4));
			box-shadow: 0 0 20px rgba(168, 85, 247, 0.3);
		}
		
		.neon-title {
			font-size: 3rem;
			font-weight: bold;
			color: #22c55e;
			text-shadow: 
				0 0 10px #22c55e,
				0 0 20px #22c55e,
				0 0 30px #22c55e,
				0 0 40px #22c55e;
			animation: pulse 2s ease-in-out infinite alternate;
		}
		
		@keyframes pulse {
			0% { opacity: 1; }
			100% { opacity: 0.8; }
		}
		
		.neon-subtitle {
			color: #60a5fa;
			font-size: 1.25rem;
			font-weight: 600;
		}
		
		.neon-text-muted {
			color: #9ca3af;
		}
		
		.neon-nav {
			display: flex;
			flex-wrap: wrap;
			justify-content: center;
			gap: 0.75rem;
			margin-bottom: 2rem;
		}
		
		.fade-in {
			animation: fadeIn 0.5s ease-in-out;
		}
		
		@keyframes fadeIn {
			from { opacity: 0; }
			to { opacity: 1; }
		}
		
		.slide-up {
			animation: slideUp 0.6s ease-out;
		}
		
		@keyframes slideUp {
			from { 
				opacity: 0;
				transform: translateY(30px);
			}
			to { 
				opacity: 1;
				transform: translateY(0);
			}
		}
	</style>
`;

export const neonParticles = `
	<!-- Particules d'arrière-plan -->
	<div class="particles">
		<div class="particle" style="left: 10%; animation-delay: 0s;"></div>
		<div class="particle" style="left: 20%; animation-delay: 1s;"></div>
		<div class="particle" style="left: 30%; animation-delay: 2s;"></div>
		<div class="particle" style="left: 40%; animation-delay: 3s;"></div>
		<div class="particle" style="left: 50%; animation-delay: 4s;"></div>
		<div class="particle" style="left: 60%; animation-delay: 5s;"></div>
		<div class="particle" style="left: 70%; animation-delay: 2s;"></div>
		<div class="particle" style="left: 80%; animation-delay: 1s;"></div>
		<div class="particle" style="left: 90%; animation-delay: 3s;"></div>
	</div>
`;

export function createNeonContainer(content: string): string {
	return `
		${neonThemeStyles}
		${neonParticles}
		<div class="min-h-screen bg-gray-900 text-white font-mono overflow-hidden">
			<div class="min-h-screen flex flex-col items-center justify-center p-4 scan-lines relative">
				${content}
			</div>
		</div>
	`;
}