CREATE TABLE `courses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`location` varchar(255),
	`par` int NOT NULL DEFAULT 72,
	`holes` int NOT NULL DEFAULT 18,
	`holePars` json,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `courses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `holeScores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roundId` int NOT NULL,
	`holeNumber` int NOT NULL,
	`par` int NOT NULL,
	`score` int NOT NULL,
	`putts` int,
	`fairwayHit` enum('hit','left','right','na') DEFAULT 'na',
	`greenInRegulation` boolean DEFAULT false,
	`penalties` int DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `holeScores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rounds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` int NOT NULL,
	`playedAt` timestamp NOT NULL,
	`totalScore` int,
	`totalPutts` int,
	`fairwaysHit` int,
	`fairwaysTotal` int,
	`greensInRegulation` int,
	`notes` text,
	`weatherData` json,
	`aiAnalysis` text,
	`scorecardImageUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rounds_id` PRIMARY KEY(`id`)
);
