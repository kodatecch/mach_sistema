import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { StakeholdersService } from './stakeholders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { CheckPermissions } from '../auth/permissions.decorator';
import { ProjectRequest } from '../project/project-context.middleware';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StakeholdersController {
  constructor(private readonly stakeholdersService: StakeholdersService) {}

  // 1. STAKEHOLDERS ENDPOINTS
  @Get('stakeholders')
  async getStakeholders(@Req() req: ProjectRequest) {
    return this.stakeholdersService.getStakeholders(req.projectId, req.user.userId);
  }

  @Post('stakeholders')
  @CheckPermissions('create', 'stakeholders')
  async createStakeholder(
    @Req() req: ProjectRequest,
    @Body() body: {
      name: string;
      email?: string;
      phone?: string;
      role: string;
      organization?: string;
      powerLevel: number;
      interestLevel: number;
      engagementLevel?: string;
    }
  ) {
    if (!body.name || !body.role) {
      throw new BadRequestException('Campos obrigatórios: nome e cargo do stakeholder.');
    }
    return this.stakeholdersService.createStakeholder(req.projectId, req.user.userId, body);
  }

  @Patch('stakeholders/:id')
  @CheckPermissions('update', 'stakeholders')
  async updateStakeholder(
    @Req() req: ProjectRequest,
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      email?: string;
      phone?: string;
      role?: string;
      organization?: string;
      powerLevel?: number;
      interestLevel?: number;
      engagementLevel?: string;
    }
  ) {
    return this.stakeholdersService.updateStakeholder(req.projectId, req.user.userId, id, body);
  }

  @Delete('stakeholders/:id')
  @CheckPermissions('delete', 'stakeholders')
  async deleteStakeholder(
    @Req() req: ProjectRequest,
    @Param('id') id: string
  ) {
    return this.stakeholdersService.deleteStakeholder(req.projectId, req.user.userId, id);
  }

  // 2. MENDELOW MATRIX SEGMENTATION
  @Get('stakeholders/mendelow')
  async getMendelow(@Req() req: ProjectRequest) {
    return this.stakeholdersService.getMendelow(req.projectId, req.user.userId);
  }

  // 3. COMMUNICATION MATRIX ENDPOINTS
  @Get('communication-matrix')
  async getCommunicationMatrix(@Req() req: ProjectRequest) {
    return this.stakeholdersService.getCommunicationMatrix(req.projectId, req.user.userId);
  }

  @Post('communication-matrix')
  @CheckPermissions('create', 'stakeholders')
  async createCommunicationMatrix(
    @Req() req: ProjectRequest,
    @Body() body: {
      stakeholderId: string;
      reportWhat: string;
      channel: string;
      frequency: string;
      responsible: string;
    }
  ) {
    if (!body.stakeholderId || !body.reportWhat || !body.channel || !body.frequency || !body.responsible) {
      throw new BadRequestException('Campos correspondentes à matriz de comunicação incompletos.');
    }
    return this.stakeholdersService.createCommunicationMatrix(req.projectId, req.user.userId, body);
  }

  @Patch('communication-matrix/:id')
  @CheckPermissions('update', 'stakeholders')
  async updateCommunicationMatrix(
    @Req() req: ProjectRequest,
    @Param('id') id: string,
    @Body() body: {
      stakeholderId?: string;
      reportWhat?: string;
      channel?: string;
      frequency?: string;
      responsible?: string;
    }
  ) {
    return this.stakeholdersService.updateCommunicationMatrix(req.projectId, req.user.userId, id, body);
  }

  @Delete('communication-matrix/:id')
  @CheckPermissions('delete', 'stakeholders')
  async deleteCommunicationMatrix(
    @Req() req: ProjectRequest,
    @Param('id') id: string
  ) {
    return this.stakeholdersService.deleteCommunicationMatrix(req.projectId, req.user.userId, id);
  }

  // 4. COMMUNICATION LOG (COMMUNICATIONS LOG)
  @Get('communication-log')
  async getCommunicationLogs(@Req() req: ProjectRequest) {
    return this.stakeholdersService.getCommunicationLogs(req.projectId, req.user.userId);
  }

  @Post('communication-log')
  @CheckPermissions('create', 'stakeholders')
  async createCommunicationLog(
    @Req() req: ProjectRequest,
    @Body() body: {
      stakeholderId: string;
      date?: string;
      channel: string;
      summary?: string;
      audioAttachmentUrl?: string;
      keyPoints?: any;
    }
  ) {
    if (!body.stakeholderId || !body.channel) {
      throw new BadRequestException('Campos obrigatórios: stakeholderId e canal.');
    }
    return this.stakeholdersService.createCommunicationLog(req.projectId, req.user.userId, body);
  }

  @Delete('communication-log/:id')
  @CheckPermissions('delete', 'stakeholders')
  async deleteCommunicationLog(
    @Req() req: ProjectRequest,
    @Param('id') id: string
  ) {
    return this.stakeholdersService.deleteCommunicationLog(req.projectId, req.user.userId, id);
  }

  // AUDIO UPLOAD
  @Post('communication-log/upload')
  @CheckPermissions('create', 'stakeholders')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAudio(
    @Req() req: ProjectRequest,
    @UploadedFile() file: any
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }
    const url = await this.stakeholdersService.uploadAudioFile(req.projectId, file);
    return { url };
  }
}
