import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StakeholdersService {
  private s3Client: any = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  // Context & Role Helpers
  private async checkProjectAccess(projectId: string, userId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId },
      },
    });
    if (!member) {
      throw new ForbiddenException('Acesso negado: Você não é membro deste projeto.');
    }
  }

  // --- STAKEHOLDERS CRUD ---
  async getStakeholders(projectId: string, userId: string) {
    await this.checkProjectAccess(projectId, userId);
    return this.prisma.stakeholder.findMany({
      where: { projectId },
      orderBy: { name: 'asc' },
    });
  }

  async createStakeholder(projectId: string, userId: string, data: any) {
    await this.checkProjectAccess(projectId, userId);
    
    // Validate levels
    const powerLevel = Number(data.powerLevel) || 1;
    const interestLevel = Number(data.interestLevel) || 1;

    return this.prisma.stakeholder.create({
      data: {
        projectId,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        role: data.role,
        organization: data.organization || null,
        powerLevel,
        interestLevel,
        engagementLevel: data.engagementLevel || 'unaware',
      },
    });
  }

  async updateStakeholder(projectId: string, userId: string, id: string, data: any) {
    await this.checkProjectAccess(projectId, userId);

    const existing = await this.prisma.stakeholder.findFirst({
      where: { id, projectId },
    });
    if (!existing) {
      throw new NotFoundException('Stakeholder não encontrado neste projeto.');
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.organization !== undefined) updateData.organization = data.organization || null;
    if (data.powerLevel !== undefined) updateData.powerLevel = Number(data.powerLevel);
    if (data.interestLevel !== undefined) updateData.interestLevel = Number(data.interestLevel);
    if (data.engagementLevel !== undefined) updateData.engagementLevel = data.engagementLevel;

    return this.prisma.stakeholder.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteStakeholder(projectId: string, userId: string, id: string) {
    await this.checkProjectAccess(projectId, userId);

    const existing = await this.prisma.stakeholder.findFirst({
      where: { id, projectId },
    });
    if (!existing) {
      throw new NotFoundException('Stakeholder não encontrado neste projeto.');
    }

    return this.prisma.stakeholder.delete({
      where: { id },
    });
  }

  // --- MENDELOW SEGMENTATION ---
  async getMendelow(projectId: string, userId: string) {
    await this.checkProjectAccess(projectId, userId);

    const stakeholders = await this.prisma.stakeholder.findMany({
      where: { projectId },
    });

    // Categorize
    return stakeholders.map(s => {
      let quadrant: 'key_players' | 'keep_satisfied' | 'keep_informed' | 'monitor' = 'monitor';
      const power = s.powerLevel;
      const interest = s.interestLevel;

      if (power >= 3 && interest >= 3) {
        quadrant = 'key_players';
      } else if (power >= 3 && interest < 3) {
        quadrant = 'keep_satisfied';
      } else if (power < 3 && interest >= 3) {
        quadrant = 'keep_informed';
      } else {
        quadrant = 'monitor';
      }

      return {
        ...s,
        quadrant,
      };
    });
  }

  // --- COMMUNICATION MATRIX CRUD ---
  async getCommunicationMatrix(projectId: string, userId: string) {
    await this.checkProjectAccess(projectId, userId);
    return this.prisma.communicationMatrix.findMany({
      where: { projectId },
      include: {
        stakeholder: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCommunicationMatrix(projectId: string, userId: string, data: any) {
    await this.checkProjectAccess(projectId, userId);

    // Verify stakeholder exists
    const stakeholder = await this.prisma.stakeholder.findFirst({
      where: { id: data.stakeholderId, projectId },
    });
    if (!stakeholder) {
      throw new NotFoundException('Stakeholder associado não encontrado.');
    }

    return this.prisma.communicationMatrix.create({
      data: {
        projectId,
        stakeholderId: data.stakeholderId,
        reportWhat: data.reportWhat,
        channel: data.channel,
        frequency: data.frequency,
        responsible: data.responsible,
      },
      include: {
        stakeholder: true,
      }
    });
  }

  async updateCommunicationMatrix(projectId: string, userId: string, id: string, data: any) {
    await this.checkProjectAccess(projectId, userId);

    const existing = await this.prisma.communicationMatrix.findFirst({
      where: { id, projectId },
    });
    if (!existing) {
      throw new NotFoundException('Registro da matriz de comunicação não encontrado.');
    }

    const updateData: any = {};
    if (data.stakeholderId !== undefined) {
      const stakeholder = await this.prisma.stakeholder.findFirst({
        where: { id: data.stakeholderId, projectId },
      });
      if (!stakeholder) {
        throw new NotFoundException('Stakeholder associado não encontrado.');
      }
      updateData.stakeholderId = data.stakeholderId;
    }
    if (data.reportWhat !== undefined) updateData.reportWhat = data.reportWhat;
    if (data.channel !== undefined) updateData.channel = data.channel;
    if (data.frequency !== undefined) updateData.frequency = data.frequency;
    if (data.responsible !== undefined) updateData.responsible = data.responsible;

    return this.prisma.communicationMatrix.update({
      where: { id },
      data: updateData,
      include: { stakeholder: true },
    });
  }

  async deleteCommunicationMatrix(projectId: string, userId: string, id: string) {
    await this.checkProjectAccess(projectId, userId);

    const existing = await this.prisma.communicationMatrix.findFirst({
      where: { id, projectId },
    });
    if (!existing) {
      throw new NotFoundException('Registro da matriz não encontrado neste projeto.');
    }

    return this.prisma.communicationMatrix.delete({
      where: { id },
    });
  }

  // --- COMMUNICATION LOG CRUD ---
  async getCommunicationLogs(projectId: string, userId: string) {
    await this.checkProjectAccess(projectId, userId);
    return this.prisma.communicationLog.findMany({
      where: { projectId },
      include: {
        stakeholder: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  async createCommunicationLog(projectId: string, userId: string, data: any) {
    await this.checkProjectAccess(projectId, userId);

    // Verify stakeholder exists
    const stakeholder = await this.prisma.stakeholder.findFirst({
      where: { id: data.stakeholderId, projectId },
    });
    if (!stakeholder) {
      throw new NotFoundException('Stakeholder associado não encontrado.');
    }

    let parsedKeyPoints: any = null;
    if (data.keyPoints) {
      if (typeof data.keyPoints === 'string') {
        try {
          parsedKeyPoints = JSON.parse(data.keyPoints);
        } catch {
          parsedKeyPoints = data.keyPoints.split(',').map((x: string) => x.trim()).filter(Boolean);
        }
      } else {
        parsedKeyPoints = data.keyPoints;
      }
    }

    const newLog = await this.prisma.communicationLog.create({
      data: {
        projectId,
        stakeholderId: data.stakeholderId,
        date: data.date ? new Date(data.date) : new Date(),
        channel: data.channel,
        summary: data.summary || '',
        audioAttachmentUrl: data.audioAttachmentUrl || null,
        keyPoints: parsedKeyPoints,
      },
      include: {
        stakeholder: true,
      },
    });

    // Emit event for real-time synchronization
    this.realtimeGateway.broadcastToProject(projectId, 'communication.logged', newLog);

    return newLog;
  }

  async deleteCommunicationLog(projectId: string, userId: string, id: string) {
    await this.checkProjectAccess(projectId, userId);

    const existing = await this.prisma.communicationLog.findFirst({
      where: { id, projectId },
    });
    if (!existing) {
      throw new NotFoundException('Ata não encontrada neste projeto.');
    }

    return this.prisma.communicationLog.delete({
      where: { id },
    });
  }

  // --- ARQUIVO / AUDIO STORAGE S3 OR LOCAL FALLBACK ---
  async uploadAudioFile(projectId: string, file: any): Promise<string> {
    const s3Endpoint = process.env.R2_ENDPOINT || process.env.S3_ENDPOINT || process.env.AWS_S3_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME || process.env.AWS_S3_BUCKET || process.env.S3_BUCKET_NAME;

    const fileExtension = path.extname(file.originalname) || '.mp3';
    const randomizedFileName = `audio_${projectId}_${Date.now()}_${Math.floor(Math.random() * 10000)}${fileExtension}`;

    // Lazy initialization of S3 SDK if configured
    if (s3Endpoint && accessKeyId && secretAccessKey && bucketName) {
      try {
        if (!this.s3Client) {
          const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
          this.s3Client = new S3Client({
            endpoint: s3Endpoint,
            region: process.env.AWS_REGION || 'auto',
            credentials: {
              accessKeyId,
              secretAccessKey,
            },
            forcePathStyle: true,
          });
        }

        const { PutObjectCommand } = await import('@aws-sdk/client-s3');
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: randomizedFileName,
            Body: file.buffer,
            ContentType: file.mimetype || 'audio/mpeg',
          })
        );

        // Calculate and return S3/R2 Public URL
        return `${s3Endpoint}/${bucketName}/${randomizedFileName}`;
      } catch (err) {
        console.error('Falha no upload para o S3/R2, efetuando fallback local:', err);
      }
    }

    // --- LOCAL STORAGE FALLBACK ---
    // Ensure local path exists (backend/uploads)
    const uploadDirPath = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDirPath)) {
      fs.mkdirSync(uploadDirPath, { recursive: true });
    }

    const destinationFilePath = path.join(uploadDirPath, randomizedFileName);
    fs.writeFileSync(destinationFilePath, file.buffer);

    // Return relative URL that our Express static middleware serves
    return `/uploads/${randomizedFileName}`;
  }
}
