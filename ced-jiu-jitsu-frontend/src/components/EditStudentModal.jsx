import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { updateStudent } from '../lib/api';

const EditStudentModal = ({ student, isOpen, onClose, onSaveSuccess }) => {
  const [formData, setFormData] = useState(student);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setFormData(student);
    setMessage(null);
  }, [student, isOpen]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSelectChange = (value, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await updateStudent(student.uid, formData);
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Aluno atualizado com sucesso!' });
        onSaveSuccess();
        onClose();
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Erro ao atualizar aluno.' });
      }
    } catch (error) {
      console.error('Erro ao atualizar aluno:', error);
      setMessage({ type: 'error', text: 'Erro ao atualizar aluno. Verifique os dados.' });
    } finally {
      setLoading(false);
    }
  };

  if (!student) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Aluno: {student.name}</DialogTitle>
          <DialogDescription>
            Faça as alterações necessárias e clique em salvar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {message && (
            <Alert className={`mb-4 ${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className={message.type === 'error' ? 'text-red-700' : 'text-green-700'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Nome</Label>
            <Input id="name" value={formData.name || ''} onChange={handleChange} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">Email</Label>
            <Input id="email" type="email" value={formData.email || ''} onChange={handleChange} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="belt" className="text-right">Faixa</Label>
            <Select value={formData.belt || ''} onValueChange={(value) => handleSelectChange(value, 'belt')}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione a faixa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="branca">Branca</SelectItem>
                <SelectItem value="cinza">Cinza</SelectItem>
                <SelectItem value="amarela">Amarela</SelectItem>
                <SelectItem value="laranja">Laranja</SelectItem>
                <SelectItem value="verde">Verde</SelectItem>
                <SelectItem value="azul">Azul</SelectItem>
                <SelectItem value="roxa">Roxa</SelectItem>
                <SelectItem value="marrom">Marrom</SelectItem>
                <SelectItem value="preta">Preta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="age" className="text-right">Idade</Label>
            <Input id="age" type="number" value={formData.age || ''} onChange={handleChange} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="degrees" className="text-right">Graus</Label>
            <Input id="degrees" type="number" value={formData.degrees || ''} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="start_date" className="text-right">Data Início</Label>
            <Input id="start_date" type="date" value={formData.start_date ? formData.start_date.split('T')[0] : ''} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address" className="text-right">Endereço</Label>
            <Input id="address" value={formData.address || ''} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="education" className="text-right">Escolaridade</Label>
            <Input id="education" value={formData.education || ''} onChange={handleChange} className="col-span-3" />
          </div>
        </form>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
            ) : (
              'Salvar alterações'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditStudentModal;


