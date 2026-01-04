import fs from 'fs';
import path from 'path';
import { UPLOADS_DIR } from './FileService';
import { prisma } from '../db';

export class QuestionService {
    static async createQuestion(data: { text: string; options: string[]; correctOptionIndex: number; tags?: string[] }, file?: Express.Multer.File) {
        // Prepare options
        const optionsData = data.options.map((opt, index) => ({
            text: opt,
            isCorrect: index === Number(data.correctOptionIndex)
        }));

        // Prepare Tags (Connect or Create)
        const tags = data.tags || [];
        const tagConnectors = tags.map(tagName => ({
            where: { name: tagName },
            create: { name: tagName }
        }));

        // Create Question Transaction
        const question = await prisma.question.create({
            data: {
                text: data.text,
                audioUrl: file ? file.filename : null,
                options: {
                    create: optionsData
                },
                tags: {
                    connectOrCreate: tagConnectors
                }
            },
            include: {
                options: true,
                tags: true
            }
        });

        return question;
    }

    static async listQuestions() {
        return prisma.question.findMany({
            include: {
                options: true,
                tags: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async deleteQuestion(id: string) {
        const question = await prisma.question.findUnique({ where: { id } });
        if (question && question.audioUrl) {
            // Delete file
            const filePath = path.join(UPLOADS_DIR, question.audioUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        return prisma.question.delete({ where: { id } });
    }

    static async listTags() {
        return prisma.tag.findMany({
            orderBy: { name: 'asc' }
        });
    }
}
