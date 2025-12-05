"""add jd builder and llm tracking models

Revision ID: add_jd_builder_llm
Revises: 2025_12_04_2130_add_job_details_columns
Create Date: 2025-12-05 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_jd_builder_llm'
down_revision = '2025_12_04_2130_add_job_details_columns'
branch_labels = None
depends_on = None


def upgrade():
    # Create job_descriptions table
    op.create_table(
        'job_descriptions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('job_title', sa.String(), nullable=False),
        sa.Column('department', sa.String(), nullable=True),
        sa.Column('employment_type', sa.String(), nullable=True),
        sa.Column('location', sa.String(), nullable=True),
        sa.Column('seniority_level', sa.String(), nullable=True),
        sa.Column('min_years_experience', sa.Integer(), nullable=True),
        sa.Column('max_years_experience', sa.Integer(), nullable=True),
        sa.Column('company_type', sa.String(), nullable=True),
        sa.Column('industry', sa.String(), nullable=True),
        sa.Column('prior_roles', sa.Text(), nullable=True),
        sa.Column('structured_jd', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('source', sa.Enum('BUILDER', 'UPLOAD', 'MANUAL', name='jdsource'), nullable=False),
        sa.Column('original_jd_text', sa.Text(), nullable=True),
        sa.Column('missing_fields', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('status', sa.Enum('DRAFT', 'GENERATING', 'COMPLETED', 'FAILED', name='jdstatus'), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_job_descriptions_id'), 'job_descriptions', ['id'], unique=False)
    op.create_index(op.f('ix_job_descriptions_user_id'), 'job_descriptions', ['user_id'], unique=False)

    # Create cv_parse_details table
    op.create_table(
        'cv_parse_details',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('cv_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('parsed_data', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('candidate_name', sa.String(), nullable=True),
        sa.Column('candidate_email', sa.String(), nullable=True),
        sa.Column('current_role', sa.String(), nullable=True),
        sa.Column('current_company', sa.String(), nullable=True),
        sa.Column('total_experience_years', sa.Float(), nullable=True),
        sa.Column('career_level', sa.String(), nullable=True),
        sa.Column('current_skills_count', sa.Integer(), default=0),
        sa.Column('outdated_skills_count', sa.Integer(), default=0),
        sa.Column('github_username', sa.String(), nullable=True),
        sa.Column('cv_quality_score', sa.Integer(), nullable=True),
        sa.Column('parsing_confidence', sa.String(), nullable=True),
        sa.Column('red_flags_count', sa.Integer(), default=0),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['cv_id'], ['cvs.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('cv_id')
    )
    op.create_index(op.f('ix_cv_parse_details_id'), 'cv_parse_details', ['id'], unique=False)
    op.create_index(op.f('ix_cv_parse_details_cv_id'), 'cv_parse_details', ['cv_id'], unique=False)
    op.create_index(op.f('ix_cv_parse_details_user_id'), 'cv_parse_details', ['user_id'], unique=False)
    op.create_index(op.f('ix_cv_parse_details_candidate_name'), 'cv_parse_details', ['candidate_name'], unique=False)
    op.create_index(op.f('ix_cv_parse_details_candidate_email'), 'cv_parse_details', ['candidate_email'], unique=False)

    # Create llm_calls table
    op.create_table(
        'llm_calls',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('job_description_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('cv_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('cv_parse_detail_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('call_type', sa.Enum('JD_GENERATION', 'JD_PARSING', 'CV_PARSING', 'CV_MATCHING', 'GITHUB_ANALYSIS', name='llmcalltype'), nullable=False),
        sa.Column('model_name', sa.String(), nullable=False),
        sa.Column('provider', sa.String(), default='bedrock'),
        sa.Column('input_tokens', sa.Integer(), nullable=False, default=0),
        sa.Column('output_tokens', sa.Integer(), nullable=False, default=0),
        sa.Column('total_tokens', sa.Integer(), nullable=False, default=0),
        sa.Column('input_cost', sa.Float(), nullable=False, default=0.0),
        sa.Column('output_cost', sa.Float(), nullable=False, default=0.0),
        sa.Column('total_cost', sa.Float(), nullable=False, default=0.0),
        sa.Column('prompt_size_chars', sa.Integer(), nullable=True),
        sa.Column('response_size_chars', sa.Integer(), nullable=True),
        sa.Column('latency_ms', sa.Integer(), nullable=True),
        sa.Column('success', sa.Boolean(), default=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['job_description_id'], ['job_descriptions.id'], ),
        sa.ForeignKeyConstraint(['cv_id'], ['cvs.id'], ),
        sa.ForeignKeyConstraint(['cv_parse_detail_id'], ['cv_parse_details.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_llm_calls_id'), 'llm_calls', ['id'], unique=False)
    op.create_index(op.f('ix_llm_calls_user_id'), 'llm_calls', ['user_id'], unique=False)
    op.create_index(op.f('ix_llm_calls_job_description_id'), 'llm_calls', ['job_description_id'], unique=False)
    op.create_index(op.f('ix_llm_calls_cv_id'), 'llm_calls', ['cv_id'], unique=False)
    op.create_index(op.f('ix_llm_calls_cv_parse_detail_id'), 'llm_calls', ['cv_parse_detail_id'], unique=False)
    op.create_index(op.f('ix_llm_calls_call_type'), 'llm_calls', ['call_type'], unique=False)

    # Create github_analyses table
    op.create_table(
        'github_analyses',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('cv_parse_detail_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('github_username', sa.String(), nullable=False),
        sa.Column('analysis_data', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('github_score', sa.Integer(), nullable=True),
        sa.Column('activity_level', sa.String(), nullable=True),
        sa.Column('last_activity_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('days_since_last_activity', sa.Integer(), nullable=True),
        sa.Column('code_quality_score', sa.Integer(), nullable=True),
        sa.Column('green_flags_count', sa.Integer(), default=0),
        sa.Column('red_flags_count', sa.Integer(), default=0),
        sa.Column('cv_github_alignment', sa.String(), nullable=True),
        sa.Column('success', sa.Boolean(), default=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['cv_parse_detail_id'], ['cv_parse_details.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('cv_parse_detail_id')
    )
    op.create_index(op.f('ix_github_analyses_id'), 'github_analyses', ['id'], unique=False)
    op.create_index(op.f('ix_github_analyses_cv_parse_detail_id'), 'github_analyses', ['cv_parse_detail_id'], unique=False)
    op.create_index(op.f('ix_github_analyses_user_id'), 'github_analyses', ['user_id'], unique=False)
    op.create_index(op.f('ix_github_analyses_github_username'), 'github_analyses', ['github_username'], unique=False)


def downgrade():
    # Drop tables in reverse order
    op.drop_index(op.f('ix_github_analyses_github_username'), table_name='github_analyses')
    op.drop_index(op.f('ix_github_analyses_user_id'), table_name='github_analyses')
    op.drop_index(op.f('ix_github_analyses_cv_parse_detail_id'), table_name='github_analyses')
    op.drop_index(op.f('ix_github_analyses_id'), table_name='github_analyses')
    op.drop_table('github_analyses')

    op.drop_index(op.f('ix_llm_calls_call_type'), table_name='llm_calls')
    op.drop_index(op.f('ix_llm_calls_cv_parse_detail_id'), table_name='llm_calls')
    op.drop_index(op.f('ix_llm_calls_cv_id'), table_name='llm_calls')
    op.drop_index(op.f('ix_llm_calls_job_description_id'), table_name='llm_calls')
    op.drop_index(op.f('ix_llm_calls_user_id'), table_name='llm_calls')
    op.drop_index(op.f('ix_llm_calls_id'), table_name='llm_calls')
    op.drop_table('llm_calls')

    op.drop_index(op.f('ix_cv_parse_details_candidate_email'), table_name='cv_parse_details')
    op.drop_index(op.f('ix_cv_parse_details_candidate_name'), table_name='cv_parse_details')
    op.drop_index(op.f('ix_cv_parse_details_user_id'), table_name='cv_parse_details')
    op.drop_index(op.f('ix_cv_parse_details_cv_id'), table_name='cv_parse_details')
    op.drop_index(op.f('ix_cv_parse_details_id'), table_name='cv_parse_details')
    op.drop_table('cv_parse_details')

    op.drop_index(op.f('ix_job_descriptions_user_id'), table_name='job_descriptions')
    op.drop_index(op.f('ix_job_descriptions_id'), table_name='job_descriptions')
    op.drop_table('job_descriptions')

    # Drop enums
    op.execute('DROP TYPE IF EXISTS jdsource')
    op.execute('DROP TYPE IF EXISTS jdstatus')
    op.execute('DROP TYPE IF EXISTS llmcalltype')
