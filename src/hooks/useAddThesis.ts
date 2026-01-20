// src/hooks/useAddThesis.ts
import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useCloudinaryUpload } from './useCloudinaryUpload';
import * as thesisService from '../services/thesisService';
import type { Thesis } from '../types/thesis';

export const useAddThesis = () => {
	const { departmentName } = useParams<{ departmentName: string }>();
	const { uploadFile, isUploading: isCloudinaryUploading } = useCloudinaryUpload();

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const decodedDepartmentName = departmentName ? decodeURIComponent(departmentName) : '';

	const handleAddThesis = useCallback(async (
		formData: Omit<Thesis, 'id' | 'coverImageUrl' | 'pdfUrl' | 'createdAt' | 'commentaire'>,
		coverFile: File | null,
		pdfFile: File | null
	) => {
		if (isSubmitting) return;

		if (!coverFile || !pdfFile) {
			setError("A cover image and a PDF file are required.");
			setSuccess(false);
			return;
		}

		setIsSubmitting(true);
		setError(null);
		setSuccess(false);

		try {
			console.log('🚀 Starting upload...');

			const coverImageUrl = await uploadFile(coverFile, {
				tags: ['thesis_cover', formData.department, formData.title],
			});

			if (!coverImageUrl) throw new Error("Cover image upload failed.");
			console.log('✅ Cover uploaded:', coverImageUrl);

			const pdfUrl = await uploadFile(pdfFile, {
				tags: ['thesis_pdf', formData.department, formData.title],
			});

			if (!pdfUrl) throw new Error("PDF upload failed.");
			console.log('✅ PDF uploaded:', pdfUrl);

			await thesisService.addThesis({
				...formData,
				coverImageUrl,
				pdfUrl,
			});

			console.log('✅ Thesis added to database');

			setSuccess(true);
			setError(null);

			// 🔥 SUPPRIMÉ : La navigation automatique
			// Cette ligne causait le problème - elle redirige avant que le message ne s'affiche
			// setTimeout(() => {
			// 	navigate(`/dashboard/thesis/${departmentName}`);
			// }, 1200);

		} catch (err) {
			console.error('❌ Error:', err);
			setError(err instanceof Error ? err.message : "Unknown error.");
			setSuccess(false);
		} finally {
			setIsSubmitting(false);
		}
	}, [uploadFile, isSubmitting]);

	return {
		handleAddThesis,
		isSubmitting: isSubmitting || isCloudinaryUploading,
		error,
		success,
		initialDepartment: decodedDepartmentName,
	};
};
